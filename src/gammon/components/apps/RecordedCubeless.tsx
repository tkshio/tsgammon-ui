import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    buildSGEventHandlers,
    SGEventHandlerAddOn,
} from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedSingleGame,
    RecordedSingleGameProps,
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorderForSingleGame } from '../recordedGames/useMatchRecorderForSingleGame'
import { OperationConfs } from '../SingleGameBoard'
import { useResignState } from '../useResignState'
import { useSGAutoOperator } from '../useSGAutoOperator'
import { useSingleGameState } from '../useSingleGameState'
import { mayResignOrNot } from './Cubeless'
import './main.css'

export type UnlimitedSingleGameProps = {
    gameConf?: GameConf
    state?: GameSetup
    sgConfs?: OperationConfs
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
} & Partial<RollListener>

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function UnlimitedSingleGame(props: UnlimitedSingleGameProps) {
    const {
        gameConf = standardConf,
        state,
        sgConfs = {},
        autoOperators = {},
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
    } = props

    const initialSGState = toSGState(state)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const mayResign = mayResignOrNot(sgState)

    const { resignState, resignStateAddOn, resignEventHandlers } =
        useResignState(mayResign, autoOperators)
    const { handlers, matchRecord } = useRecordedCubeless(
        gameConf,
        setSGState,
        rollListener,
        resignStateAddOn
    )
    useSGAutoOperator(sgState, autoOperators.sg, handlers)

    const recordedMatchProps: RecordedSingleGameProps = {
        resignState,
        sgState,
        opConfs: sgConfs,
        matchRecord,
        ...handlers,
        ...resignEventHandlers,
    }

    return <RecordedSingleGame {...recordedMatchProps} />
}

function useRecordedCubeless(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners(),
    ...addOns: SGEventHandlerAddOn[]
) {
    const { matchRecord, matchRecorder, matchRecordAddOn } =
        useMatchRecorderForSingleGame(gameConf)
    const { handlers } = buildSGEventHandlers(
        defaultSGState(gameConf),
        setSGState,
        rollListener,
        matchRecordAddOn,
        ...addOns
    )
    return {
        handlers: {
            ...handlers,
            onResumeState: (index: number) => {
                const resumed = matchRecorder.resumeTo(index)
                setSGState(resumed.state)
            },
        },
        matchRecord,
    }
}
