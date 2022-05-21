import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { singleGameDispatcher } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGState,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { plyRecordForEoG } from 'tsgammon-core/records/PlyRecord'
import { defaultSGState } from '../defaultStates'
import { buildSGEventHandlers } from '../eventHandlers/SingleGameEventHandlers'
import {
    RecordedSingleGame,
    RecordedSingleGameProps,
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { SingleGameConfs } from '../SingleGameBoard'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'
import { sgEventHandlersForMatchRecorder } from './PointMatch'

export type UnlimitedSingleGameProps = {
    gameConf?: GameConf
    state?: GameSetup
    sgConfs?: SingleGameConfs
}

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function UnlimitedSingleGame(props: UnlimitedSingleGameProps) {
    const { gameConf = standardConf, state, sgConfs = {} } = props

    const initialSGState = toSGState(state)
    const rollListener = rollListeners()
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const { handlers, matchRecord } = useRecordedCubeless(
        gameConf,
        setSGState,
        rollListener
    )
    const recordedMatchProps: RecordedSingleGameProps = {
        sgState,
        sgConfs,
        matchRecord,
        ...handlers,
    }

    return <RecordedSingleGame {...recordedMatchProps} />
}

function useRecordedCubeless(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners()
) {
    const [matchRecord, matchRecorder] = useMatchRecorder<SGState>(gameConf)
    const matchRecordAddOn = {
        listeners: {
            onEndOfGame: (sgEoG: SGEoG) => {
                const { stake, result, eogStatus } = sgEoG
                matchRecorder.recordEoG(
                    plyRecordForEoG(stake, result, eogStatus)
                )
            },
        },
        eventHandlers: sgEventHandlersForMatchRecorder(matchRecorder),
    }

    const { handlers } = buildSGEventHandlers(
        defaultSGState(gameConf),
        setSGState,
        singleGameDispatcher(),
        rollListener,
        matchRecordAddOn
    )

    return {
        handlers: {
            ...handlers,
            onResumeState: (index: number) => {
                const resumed = matchRecorder.resumeTo(index)
                setSGState(resumed)
            },
        },
        matchRecord,
    }
}
