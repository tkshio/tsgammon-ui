import { useState } from 'react'
import { BoardStateNode, score, Score } from 'tsgammon-core'
import {
    CBAction,
    CBResponse,
    CBState,
} from 'tsgammon-core/dispatchers/CubeGameState'
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
    PlyRecordEoG,
    plyRecordForCheckerPlay,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake,
    PlyRecordInPlay,
} from 'tsgammon-core/records/PlyRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameConfs } from '../CubefulGameBoard'
import {
    CubeGameEventHandlers,
    GameEventHandlers,
    SingleGameEventHandlers,
} from '../EventHandlers'
import { BGState, toState } from '../recordedGames/BGState'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import {
    MatchRecorder,
    useMatchRecorder,
} from '../recordedGames/useMatchRecorder'
import { useCubeGameState } from '../useCubeGameState'
import './main.css'

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
    const { cbState: initialCBState, sgState: initialSGState } = toState(
        props.board
    )

    // Propsで指定したマッチ情報は初期化の時に一回だけ参照される
    const initialMatchRecord = setEoG(
        { cbState: initialCBState, sgState: initialSGState },
        gameConf,
        initMatchRecord<BGState>(gameConf, matchLength, curScore, isCrawford)
    )

    const {
        cbState,
        sgState,
        eventHandlers: cbEventHandlers,
        gameEventHandlers,
    } = useCubeGameState(
        gameConf,
        isCrawford,
        initialSGState,
        initialCBState,
        rollListener
    )
    const [matchRecord, matchRecorder] = useMatchRecorder<BGState>(
        gameConf,
        initialMatchRecord
    )

    const { matchID, eventHandlers } = useCubeGameEventHandlerWithMatchRecorder(
        { ...cbEventHandlers, ...gameEventHandlers }
    )

    const sgRec = bgMatchRecorderToSG(matchRecorder, cbState)

    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchScore: matchRecord.matchScore,
        matchRecord,
        bgState: { cbState, sgState },
        cbConfs,
        ...eventHandlers,
        ...addMatchRecorderToG(
            cbState,
            eventHandlers,
            matchRecord,
            matchRecorder
        ),
        ...addMatchRecorderToCB(sgState, eventHandlers, matchRecorder),
        ...addMatchRecorderToSG(eventHandlers, sgRec),
    }

    return <RecordedCubefulGame key={matchID} {...recordedMatchProps} />
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

export function useCubeGameEventHandlerWithMatchRecorder(
    eventHandlers: Partial<GameEventHandlers> &
        SingleGameEventHandlers &
        CubeGameEventHandlers
): {
    eventHandlers: GameEventHandlers &
        CubeGameEventHandlers &
        SingleGameEventHandlers
    matchID: number
} {
    const [matchID, setMatchID] = useState(0)
    const gameEventHandlers: GameEventHandlers = {
        onStartNextGame: () => {
            //
            if (eventHandlers.onStartNextGame) {
                eventHandlers.onStartNextGame()
            }
        },
        onResumeState: (index: number) => {
            if (eventHandlers.onResumeState) {
                eventHandlers.onResumeState(index)
            }
        },
        onEndOfMatch: () => {
            if (eventHandlers.onEndOfMatch) {
                eventHandlers.onEndOfMatch()
            }
            setMatchID((mid) => mid + 1)
        },
    }
    return {
        eventHandlers: {
            ...eventHandlers,
            ...gameEventHandlers,
        },
        matchID,
    }
}
function addMatchRecorderToG<T>(
    cbState: CBState,
    eventHandlers: GameEventHandlers &
        SingleGameEventHandlers &
        CubeGameEventHandlers,
    matchRecord: MatchRecord<BGState>,
    matchRecorder: MatchRecorder<T>
): GameEventHandlers {
    return {
        onStartNextGame: () => {
            if (cbState.tag === 'CBEoG') {
                const { stake, eogStatus } = cbState.calcStake(matchRecord.conf)
                const plyRecordEoG = plyRecordForEoG(
                    stake,
                    cbState.result,
                    eogStatus
                )
                matchRecorder.recordEoG(plyRecordEoG)
            }
            eventHandlers.onStartNextGame()
            matchRecorder.resetCurGame()
        },
        onResumeState: (index: number) => {
            eventHandlers.onResumeState(index)
            const lastState = matchRecord.curGameRecord.plyRecords[index].state
            eventHandlers.onSetCBState(lastState.cbState)
            eventHandlers.onSetSGState(lastState.sgState)
            matchRecorder.resumeTo(index)
        },
        onEndOfMatch: eventHandlers.onEndOfMatch,
    }
}

/*
        const stake = nextState.calcStake(stakeConf).stake
        const plyRecordEoG = plyRecordForEoG(
            stake,
            nextState.result,
            nextState.eogStatus
        )
        matchRecorder.recordEoG(plyRecordEoG)*/

function addMatchRecorderToCB(
    sgState: SGState,
    eventHandlers: CubeGameEventHandlers,
    matchRecorder: MatchRecorder<BGState>
): Partial<CubeGameEventHandlers> {
    return { onDouble, onTake, onPass }
    function onDouble(cbState: CBAction) {
        eventHandlers.onDouble(cbState)
        const plyRecord = plyRecordForDouble(cbState.cubeState, cbState.isRed)
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }

    function onTake(cbState: CBResponse) {
        eventHandlers.onTake(cbState)
        const plyRecord = plyRecordForTake(cbState.isRed)
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }

    function onPass(cbState: CBResponse) {
        eventHandlers.onPass(cbState)
        const plyRecord = plyRecordForPass(
            cbState.isRed ? SGResult.WHITEWON : SGResult.REDWON
        )
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }
}

function bgMatchRecorderToSG(
    matchRecorder: MatchRecorder<BGState>,
    cbState: CBState
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
            matchRecorder.resumeTo(index)
        },
    }
}

export function addMatchRecorderToSG(
    singleGameEventHandlers: SingleGameEventHandlers,
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameEventHandlers> {
    return {
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            singleGameEventHandlers.onCommit(sgState, node)

            // curPlyは常に空なので、あまり意味がない：廃止しないといけない＆ここではPlyを作るかcpStateをもらわないといけない
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(sgState.toPly(node)),
                sgState
            )
        },
    }
}
