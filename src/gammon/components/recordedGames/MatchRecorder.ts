import { GameConf } from 'tsgammon-core/GameConf'
import {
    addPlyRecord,
    discardCurrentGame,
    eogRecord,
    MatchRecord,
    recordFinishedGame,
    trimPlyRecords,
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
import { PlyStateRecord } from 'tsgammon-core/records/PlyStateRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { BGState } from 'tsgammon-core/states/BGState'
import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from 'tsgammon-core/states/CubeGameState'
import {
    SGEoG,
    SGInPlay,
    SGState,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'
import { BGListener } from '../dispatchers/BGListener'
import { SingleGameListener } from '../dispatchers/SingleGameListener'

export type MatchRecorder<T> = {
    recordPly: (plyRecord: PlyRecordInPlay, lastState: T) => void
    recordEoG: (plyRecord: PlyRecordEoG) => void
    resetCurGame: () => void
    resumeTo: (index: number) => PlyStateRecord<T>
}

/**
 * MatchRecorderをラップして、SingleGameListnerとして返す
 * @param matchRecorder ラップされるMatchRecorder
 * @returns
 */
export function matchRecorderAsSG(
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameListener> {
    return {
        onCheckerPlayCommitted: (committedState: SGInPlay) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(committedState.curPly),
                committedState
            )
        },

        onGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onEndOfGame: (sgEoG: SGEoG) => {
            const { stake, result, eogStatus } = sgEoG
            matchRecorder.recordEoG(plyRecordForEoG(stake, result, eogStatus))
        },
    }
}

/**
 * MatchRecorderをラップして、BGListnerとして返す
 * @param matchRecorder ラップされるMatchRecorder
 * @returns
 */
export function matchRecorderAsBG(
    gameConf: GameConf,
    matchRecorder: MatchRecorder<BGState>
): Partial<BGListener> {
    return {
        onDoubled: (
            bgState: { cbState: CBResponse; sgState: SGToRoll },
            lastState: CBAction
        ) => {
            const plyRecord = plyRecordForDouble(
                lastState.cubeState,
                lastState.isRed
            )
            matchRecorder.recordPly(plyRecord, {
                cbState: lastState,
                sgState: bgState.sgState,
            })
        },

        onDoubleAccepted: (
            bgState: { cbState: CBToRoll; sgState: SGToRoll },
            lastState: CBResponse
        ) => {
            const plyRecord = plyRecordForTake(lastState.isRed)
            matchRecorder.recordPly(plyRecord, {
                cbState: lastState,
                sgState: bgState.sgState,
            })
        },
        onPassed: (
            bgState: { cbState: CBResponse; sgState: SGToRoll },
            isRedWon: boolean
        ) => {
            const plyRecord = plyRecordForPass(
                isRedWon ? SGResult.REDWON : SGResult.WHITEWON
            )
            matchRecorder.recordPly(plyRecord, bgState)
        },
        onBGGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onCommitted: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            const committedState = bgState.sgState
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(committedState.curPly),
                bgState
            )
        },
        onEndOfBGGame: (bgState: { cbState: CBEoG; sgState: SGState }) => {
            const { stake, eogStatus } = bgState.cbState.calcStake(gameConf)
            const plyRecordEoG = plyRecordForEoG(
                stake,
                bgState.cbState.result,
                eogStatus
            )
            matchRecorder.recordEoG(plyRecordEoG)
        },
    }
}

/**
 * MatchRecorderオブジェクトを生成する
 *
 * @param matchRecord
 * @param setMatchRecord
 * @returns
 */
export function buildMatchRecorder<T>(
    matchRecord: MatchRecord<T>,
    setMatchRecord: (f: (prev: MatchRecord<T>) => MatchRecord<T>) => void
): MatchRecorder<T> {
    function recordPly(plyRecord: PlyRecordInPlay, state: T) {
        setMatchRecord((prev) =>
            prev.isEoG ? prev : addPlyRecord(prev, plyRecord, state)
        )
    }

    function recordEoG(eogPlyRecord: PlyRecordEoG) {
        setMatchRecord((prev) => {
            if (prev.isEoG) {
                return prev
            }
            return eogRecord(prev, eogPlyRecord)
        })
    }

    function resetCurGame() {
        setMatchRecord((prev) =>
            prev.isEoG ? recordFinishedGame(prev) : discardCurrentGame(prev)
        )
    }

    function resumeTo(index: number): PlyStateRecord<T> {
        setMatchRecord((prev) => trimPlyRecords(prev, index))
        return matchRecord.curGameRecord.plyRecords[index]
    }

    return {
        recordEoG,
        resetCurGame,
        recordPly,
        resumeTo,
    }
}
