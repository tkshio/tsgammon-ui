import { buildSGEventHandler } from 'tsgammon-core/dispatchers/buildSGEventHandler'
import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListener
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'

import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { SingleGameEventHandlerExtensible } from 'tsgammon-core/dispatchers/SingleGameEventHandler'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { matchRecorderAsSG } from 'tsgammon-core/records/MatchRecorder'
import { operateWithSG } from '../operateWithSG'
import { defaultPlayersConf } from '../PlayersConf'
import {
    RecordedSingleGame,
    RecordedSingleGameProps
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useSingleGameState } from '../useSingleGameState'
import { BGCommonProps } from './BGCommonProps'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'

export type CubelessProps ={
    autoOperators?: { sg: SGOperator; rs?: RSOperator }
} & BGCommonProps

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function Cubeless(props: CubelessProps) {
    const {
        gameConf = standardConf,
        playersConf = defaultPlayersConf,
        gameSetup,
        autoOperators = {sg:undefined},
        diceSource,
        onRollRequest,
        dialog,
        recordMatch = false,
        ...exListeners
    } = props

    const initialSGState = toSGState(gameSetup, gameConf)
    const rListener = rollListener({
        diceSource,
        onRollRequest
    })
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const sgRecorder = useCubeless(gameConf, setSGState, rListener)(recordMatch)
    const handlers = operateWithSG(autoOperators.sg, sgRecorder.handlers)

    const singleGameProps: SingleGameProps = {
        ...exListeners,
        sgState,
        cpState: sgRecorder.cpState,
        dialog,
        playersConf,
        ...handlers,
        ...sgRecorder.cpListeners,
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
type SGRecorder = {
    recordMatch: boolean
    handlers: SingleGameEventHandlerExtensible
    onResumeState: (index: number) => void
    matchRecord: MatchRecord<SGState>
    cpListeners: CheckerPlayListeners
    cpState: CheckerPlayState | undefined
}

function useCubeless(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rListener: RollListener
): (recordMatch: boolean) => SGRecorder {
    const { matchRecord, matchRecorder } = useMatchRecorder<SGState>(
        gameConf,
        0
    )
    const [cpState, cpListeners] = useCheckerPlayListeners()
    return (recordMatch: boolean) => {
        const matchRecordListener = matchRecorderAsSG(matchRecorder)
        const handlers = buildSGEventHandler(
            rListener,
            setSGStateListener(defaultSGState(gameConf), setSGState),
            matchRecordListener
        )
        return {
            recordMatch,
            handlers,
            onResumeState: (index: number) => {
                const resumed = matchRecorder.resumeTo(index)
                setSGState(resumed.state)
            },
            matchRecord,
            cpState,
            cpListeners,
        }
    }
}
