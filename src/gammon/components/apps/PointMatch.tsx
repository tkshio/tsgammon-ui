import { useState } from 'react'
import { BoardStateNode, score, Score } from 'tsgammon-core'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    CBAction,
    CBEoG,
    CBResponse,
    CBState
} from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGInPlay, SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import {
    matchRecord as initMatchRecord,
    MatchRecord,
    setEoGRecord
} from 'tsgammon-core/records/MatchRecord'
import {
    PlyRecordEoG,
    plyRecordForCheckerPlay,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake,
    PlyRecordInPlay
} from 'tsgammon-core/records/PlyRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameConfs } from '../CubefulGameBoard'
import {
    CubeGameEventHandlers,
    SingleGameEventHandlers
} from '../EventHandlers'
import { BGState, toState } from '../recordedGames/BGState'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps
} from '../recordedGames/RecordedCubefulGame'
import {
    MatchRecorder,
    useMatchRecorder
} from '../recordedGames/useMatchRecorder'
import { useMatchScoreForCubeGame } from '../useMatchScoreForCubeGame'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'
import { useCBState, useCubefulGameState } from './MoneyGame'

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
    const { sgState, setSGState } = useSingleGameState(
        gameConf,
        initialBGState.sgState
    )
    const { cbState, setCBState } = useCBState(initialBGState.cbState)

    // マッチにユニークなKeyを採番する
    const { matchKey, listeners: matchKeyListener } = useMatchKey()

    // スコアの管理に必要なListener
    const { matchScore, matchScoreListener } =
        useMatchScoreForCubeGame(gameConf)

    // マッチの記録に必要なListener
    const { matchRecord, matchRecorder, matchRecorderListener } =
        useMatchRecorderForCubeGame(
            gameConf,
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

    const { handlers } = useCubefulGameState(
        cbState,
        setSGState,
        setCBState,
        rollListener,
        matchKeyListener,
        matchScoreListener,
        matchRecorderListener
    )
    // マッチの記録は、Handlerでも行われる
    const cbH = cbEventHandlersForMatchRecorder(sgState, matchRecorder)
    const sbH = sgEventHandlersForMatchRecorder(
        bgMatchRecorderToSG(cbState, matchRecorder)
    )
    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchScore,
        matchRecord,
        bgState: { sgState, cbState },
        cbConfs,
        ...handlers,
        onDouble: (cbState: CBAction) => {
            handlers.onDouble(cbState)
            cbH.onDouble(cbState)
        },
        onTake: (cbState: CBResponse) => {
            handlers.onTake(cbState)
            cbH.onTake(cbState)
        },
        onPass: (cbState: CBResponse) => {
            handlers.onPass(cbState)
            cbH.onPass(cbState)
        },
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            handlers.onCommit(sgState, node)
            sbH.onCommit(sgState, node)
        },
        onStartNextGame: () => {
            handlers.onStartNextGame()
            matchRecorder.resetCurGame()
        },
        onResumeState: (index: number) => {
            const resumed = matchRecorder.resumeTo(index)
            setSGState(resumed.sgState)
            setCBState(resumed.cbState)
        },
    }

    return <RecordedCubefulGame key={matchKey} {...recordedMatchProps} />
}

function useMatchRecorderForCubeGame(
    gameConf: GameConf,
    initialMatchRecord: MatchRecord<BGState>
): {
    matchRecord: MatchRecord<BGState>
    matchRecorder: MatchRecorder<BGState>
    matchRecorderListener: Pick<CubeGameListeners, 'onEndOfCubeGame'>
} {
    const [matchRecord, matchRecorder] = useMatchRecorder<BGState>(
        gameConf,
        initialMatchRecord
    )
    const matchRecorderListener = {
        onEndOfCubeGame: (cbState: CBEoG) => {
            const { stake, eogStatus } = cbState.calcStake(gameConf)
            const plyRecordEoG = plyRecordForEoG(
                stake,
                cbState.result,
                eogStatus
            )
            matchRecorder.recordEoG(plyRecordEoG)
        },
    }
    return { matchRecord, matchRecorder, matchRecorderListener }
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
function useMatchKey(): {
    listeners: Pick<CubeGameListeners, 'onEndOfCubeGame'>
    matchKey: number
} {
    const [matchKey, setMatchKey] = useState(0)
    return {
        matchKey,
        listeners: {
            onEndOfCubeGame: (_: CBEoG) => {
                setMatchKey((mid) => mid + 1)
            },
        },
    }
}

function cbEventHandlersForMatchRecorder(
    sgState: SGState,
    matchRecorder: MatchRecorder<BGState>
): Pick<CubeGameEventHandlers, 'onDouble' | 'onTake' | 'onPass'> {
    return { onDouble, onTake, onPass }
    function onDouble(cbState: CBAction) {
        const plyRecord = plyRecordForDouble(cbState.cubeState, cbState.isRed)
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }

    function onTake(cbState: CBResponse) {
        const plyRecord = plyRecordForTake(cbState.isRed)
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }

    function onPass(cbState: CBResponse) {
        const plyRecord = plyRecordForPass(
            cbState.isRed ? SGResult.WHITEWON : SGResult.REDWON
        )
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }
}

function bgMatchRecorderToSG(
    cbState: CBState,
    matchRecorder: MatchRecorder<BGState>
): MatchRecorder<SGState> {
    return {
        recordPly: (plyRecord: PlyRecordInPlay, sgState: SGState) => {
            matchRecorder.recordPly(plyRecord, { cbState, sgState })
        },
        recordEoG: (plyRecord: PlyRecordEoG) => {
            matchRecorder.recordEoG(plyRecord)
        },
        resetCurGame: () => {
            matchRecorder.resetCurGame()
        },
        resumeTo: (index: number) => {
            return matchRecorder.resumeTo(index).sgState
        },
    }
}

export function sgEventHandlersForMatchRecorder(
    matchRecorder: MatchRecorder<SGState>
): Pick<SingleGameEventHandlers, 'onCommit'> {
    return {
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(sgState.toPly(node)),
                sgState
            )
        },
    }
}
