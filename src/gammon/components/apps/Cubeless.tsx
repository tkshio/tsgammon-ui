import { buildSGEventHandler } from 'tsgammon-core/dispatchers/buildSGEventHandler'
import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'

import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { matchRecorderAsSG } from 'tsgammon-core/records/MatchRecorder'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { operateWithSG } from '../operateWithSG'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedSingleGame,
    RecordedSingleGameProps,
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { defaultPlayersConf, PlayersConf } from '../PlayersConf'
import { useSingleGameState } from '../useSingleGameState'
import { SingleGame, SingleGameProps } from '../SingleGame'
import {
    SingleGameEventHandlerExtensible,
} from 'tsgammon-core/dispatchers/SingleGameEventHandler'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'

export type CublessProps = {
    gameConf?: GameConf
    playersConf?: PlayersConf
    state?: GameSetup
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
    dialog?: JSX.Element
    recordMatch?: boolean
} & Partial<RollListener>

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function Cubeless(props: CublessProps) {
    const {
        gameConf = standardConf,
        playersConf = defaultPlayersConf,
        state,
        autoOperators = {},
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
        dialog,
        recordMatch = false,
    } = props

    const initialSGState = toSGState(state,gameConf)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const sgRecorder = useCubeless(
        gameConf,
        setSGState,
        rollListener
    )(recordMatch)
    const handlers = operateWithSG(autoOperators.sg, sgRecorder.handlers)

    const singleGameProps: SingleGameProps = {
        sgState,
        dialog,
        playersConf,
        ...handlers,
    }
    if (sgRecorder.recordMatch) {
        const recordedGameProps: RecordedSingleGameProps = {
            ...singleGameProps,
            matchRecord: sgRecorder.matchRecord,
            onResumeState: sgRecorder.onResumeState,
        }

        return <RecordedSingleGame {...recordedGameProps} />
    } else {
        return <SingleGame {...singleGameProps} />
    }
}
type SGRecorder =
    | {
          recordMatch: true
          handlers: SingleGameEventHandlerExtensible
          onResumeState: (index: number) => void
          matchRecord: MatchRecord<SGState>
      }
    | { recordMatch: false; handlers: SingleGameEventHandlerExtensible }

function useCubeless(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners()
): (recordMatch: boolean) => SGRecorder {
    const { matchRecord, matchRecorder } = useMatchRecorder<SGState>(
        gameConf,
        0
    )
    return (recordMatch: boolean) => {
        const matchRecordListener = matchRecorderAsSG(matchRecorder)
        const handlers = buildSGEventHandler(
            rollListener,
            setSGStateListener(defaultSGState(gameConf), setSGState)
        ).addListeners(matchRecordListener)
        return {
            recordMatch,
            handlers,
            onResumeState: (index: number) => {
                const resumed = matchRecorder.resumeTo(index)
                setSGState(resumed.state)
            },
            matchRecord,
        }
    }
}
