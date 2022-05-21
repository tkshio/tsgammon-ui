import { BoardStateNode, score, Score } from 'tsgammon-core'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGInPlay, SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import {
    matchRecord as initMatchRecord,
    MatchRecord,
    setEoGRecord,
} from 'tsgammon-core/records/MatchRecord'
import {
    plyRecordForCheckerPlay,
    plyRecordForEoG,
} from 'tsgammon-core/records/PlyRecord'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BGState, toState } from '../BGState'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { defaultBGState } from '../defaultStates'
import { cubefulGameEventHandlers } from '../eventHandlers/cubefulGameEventHandlers'
import { SingleGameEventHandlers } from '../eventHandlers/SingleGameEventHandlers'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { MatchRecorder } from '../recordedGames/useMatchRecorder'
import { useMatchRecorderForCubeGame } from '../recordedGames/useMatchRecorderForCubeGame'
import { useCubeGameState } from '../useCubeGameState'
import { useMatchStateForCubeGame } from '../useMatchStateForCubeGame'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'
import { useMatchKey } from '../useMatchKey'

export type PointMatchProps = {
    gameConf?: GameConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
    board?: GameSetup
    cbConfs?: CubefulGameConfs
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
export function PointMatch(props: PointMatchProps) {
    const {
        gameConf = standardConf,
        cbConfs = { sgConfs: {} },
        matchLength = 0,
        matchScore: curScore = score(),
        isCrawford = false,
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
    } = props

    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })

    // 盤面の指定があれば、そこから開始
    const initialBGState = toState(props.board)
    // 状態管理
    const { sgState, setSGState } = useSingleGameState(initialBGState.sgState)
    const { cbState, setCBState } = useCubeGameState(initialBGState.cbState)

    // マッチにユニークなKeyを採番する
    const { matchKey, matchKeyAddOn } = useMatchKey()

    // スコアの管理に必要なListener
    const { matchState, matchStateAddOn, resetMatchState } =
        useMatchStateForCubeGame(curScore, matchLength, gameConf)

    // マッチの記録に必要なListener
    const { matchRecord, matchRecorder, matchRecorderAddOn } =
        useMatchRecorderForCubeGame(
            gameConf,
            cbState,
            sgState,
            setEoG(
                initialBGState,
                gameConf,
                initMatchRecord<BGState>(
                    gameConf,
                    matchLength,
                    curScore,
                    isCrawford
                )
            )
        )
    const onResumeState = (index: number) => {
        const resumed = matchRecorder.resumeTo(index)
        resetMatchState()
        setCBState(resumed.cbState)
        setSGState(resumed.sgState)
    }

    const { handlers } = cubefulGameEventHandlers(
        matchState.isCrawford,
        defaultBGState(gameConf),
        cbState,
        setSGState,
        setCBState,
        rollListener,

        matchKeyAddOn,
        matchStateAddOn,
        matchRecorderAddOn
    )
    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchState,
        matchRecord,
        bgState: { sgState, cbState },
        cbConfs,
        ...{ ...handlers, onResumeState },
    }

    return <RecordedCubefulGame key={matchKey} {...recordedMatchProps} />
}

// 初期状態がEoGの場合、Listenerに代わってMatchRecordにEoGを記録する
function setEoG(
    curBGState: BGState,
    stakeConf: StakeConf,
    mRecord: MatchRecord<BGState>
) {
    if (curBGState.cbState.tag === 'CBEoG') {
        const eogRecord = plyRecordForEoG(
            curBGState.cbState.calcStake(stakeConf).stake,
            curBGState.cbState.result,
            curBGState.cbState.eogStatus
        )
        return setEoGRecord(mRecord, eogRecord)
    }
    return mRecord
}

export function sgEventHandlersForMatchRecorder(
    matchRecorder: MatchRecorder<SGState>
): Pick<SingleGameEventHandlers, 'onCommit' | 'onStartGame'> {
    return {
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(sgState.toPly(node)),
                sgState
            )
        },
        onStartGame: () => {
            matchRecorder.resetCurGame()
        },
    }
}
