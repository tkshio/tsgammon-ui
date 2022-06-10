import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { buildSGEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedSingleGame,
    RecordedSingleGameProps
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorderForSingleGame } from '../recordedGames/useMatchRecorderForSingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import { useSGAutoOperator } from '../useSGAutoOperator'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'


export type UnlimitedSingleGameProps = {
    gameConf?: GameConf
    state?: GameSetup
    sgConfs?: SingleGameConfs
    autoOperator?: SGOperator
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
        autoOperator,
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

    const { handlers, matchRecord } = useRecordedCubeless(
        gameConf,
        setSGState,
        rollListener
    )
    useSGAutoOperator(sgState, autoOperator, handlers)
    const onResign = () => {
        //
    }

    const recordedMatchProps: RecordedSingleGameProps = {
        sgState,
        sgConfs,
        matchRecord,
        onResign,
        ...handlers,
    }

    return <RecordedSingleGame {...recordedMatchProps} />
}

function useRecordedCubeless(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners()
) {
    const { matchRecord, matchRecorder, matchRecordAddOn } = useMatchRecorderForSingleGame(gameConf)
    const { handlers } = buildSGEventHandlers(
        defaultSGState(gameConf),
        setSGState,
        rollListener,
        matchRecordAddOn
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
