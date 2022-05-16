import { Dispatch, SetStateAction, useState } from 'react'
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
        setCBState,
        setSGState,
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

    const { matchKey, eventHandlers } =
        useCubeGameEventHandlerWithMatchRecorder(
            gameConf,
            sgState,
            cbState,
            setCBState,
            setSGState,
            { ...cbEventHandlers, ...gameEventHandlers },
            matchRecorder
        )

    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchScore: matchRecord.matchScore,
        matchRecord,
        bgState: { cbState, sgState },
        cbConfs,
        ...eventHandlers,
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
function addMatchKey(
    eventHandlers: Partial<GameEventHandlers> &
        SingleGameEventHandlers &
        CubeGameEventHandlers,
    matchKey: number,
    setMatchKey: Dispatch<SetStateAction<number>>
): {
    eventHandlers: GameEventHandlers &
        CubeGameEventHandlers &
        SingleGameEventHandlers
    matchKey: number
} {
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
            setMatchKey((mid) => mid + 1)
        },
    }
    return {
        matchKey,
        eventHandlers: { ...eventHandlers, ...gameEventHandlers },
    }
}
export function useCubeGameEventHandlerWithMatchRecorder(
    gameConf:GameConf,
    sgState: SGState,
    cbState: CBState,
    setCBState: (cbState?: CBState) => void,
    setSGState: (sgState?: SGState) => void,

    eventHandlers: Partial<GameEventHandlers> &
        SingleGameEventHandlers &
        CubeGameEventHandlers,
    matchRecorder: MatchRecorder<BGState>
): {
    eventHandlers: GameEventHandlers &
        CubeGameEventHandlers &
        SingleGameEventHandlers
    matchKey: number
} {
    const [matchKey, setMatchKey] = useState(0)

    const { eventHandlers: eventHandlers_matchKey } = addMatchKey(
        eventHandlers,
        matchKey,
        setMatchKey
    )
    const { eventHandlers: eventHandlers_matchRecord } = addMatchRecorderToG(
        gameConf,
        cbState,
        setCBState,
        setSGState,
        eventHandlers_matchKey,
        matchRecorder
    )
    const { eventHandlers: eventHandlers_matchRecordCB } = addMatchRecorderToCB(
        sgState,
        eventHandlers_matchRecord,
        matchRecorder
    )

    const { eventHandlers: eventHandlers_matchRecordSG } = addMatchRecorderToSG(
        eventHandlers_matchRecordCB,
        eventHandlers_matchRecordCB,
        setSGState,
        bgMatchRecorderToSG(matchRecorder, cbState)
    )
    return {
        eventHandlers: {
            ...eventHandlers_matchRecordCB,
            ...eventHandlers_matchRecordSG,
        },
        matchKey: matchKey,
    }
}
function addMatchRecorderToG(
    gameConf: GameConf,
    cbState: CBState,
    setCBState: (cbState?: CBState) => void,
    setSGState: (sgState?: SGState) => void,

    eventHandlers: GameEventHandlers &
        SingleGameEventHandlers &
        CubeGameEventHandlers,
    matchRecorder: MatchRecorder<BGState>
): {
    eventHandlers: GameEventHandlers &
        SingleGameEventHandlers &
        CubeGameEventHandlers
} {
    return {
        eventHandlers: {
            ...eventHandlers,
            onStartNextGame: () => {
                eventHandlers.onStartNextGame()
                if (cbState.tag === 'CBEoG') {
                    const { stake, eogStatus } = cbState.calcStake(gameConf)
                    const plyRecordEoG = plyRecordForEoG(
                        stake,
                        cbState.result,
                        eogStatus
                    )
                    matchRecorder.recordEoG(plyRecordEoG)
                }
                matchRecorder.resetCurGame()
            },
            onResumeState: (index: number) => {
                eventHandlers.onResumeState(index)
                const lastState: BGState = matchRecorder.resumeTo(index)

                setCBState(lastState.cbState)
                setSGState(lastState.sgState)
            },
            onEndOfMatch: eventHandlers.onEndOfMatch,
        },
    }
}

function addMatchRecorderToCB(
    sgState: SGState,
    eventHandlers: GameEventHandlers &
        SingleGameEventHandlers &
        CubeGameEventHandlers,
    matchRecorder: MatchRecorder<BGState>
): {
    eventHandlers: GameEventHandlers &
        SingleGameEventHandlers &
        CubeGameEventHandlers
} {
    return { eventHandlers: { ...eventHandlers, onDouble, onTake, onPass } }
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
            return matchRecorder.resumeTo(index).sgState
        },
    }
}

export function addMatchRecorderToSG(
    singleGameEventHandlers: SingleGameEventHandlers,
    gameEventHandlers: Partial<GameEventHandlers>,
    setSGState: (sgState: SGState) => void,
    matchRecorder: MatchRecorder<SGState>
): { eventHandlers: SingleGameEventHandlers & Partial<GameEventHandlers> } {
    return {
        eventHandlers: {
            ...singleGameEventHandlers,
            ...gameEventHandlers,
            onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
                singleGameEventHandlers.onCommit(sgState, node)

                matchRecorder.recordPly(
                    plyRecordForCheckerPlay(sgState.toPly(node)),
                    sgState
                )
            },

            onResumeState: (index: number) => {
                if (gameEventHandlers.onResumeState) {
                    gameEventHandlers.onResumeState(index)
                }
                const sgState: SGState = matchRecorder.resumeTo(index)
                setSGState(sgState)
            },
        },
    }
}
