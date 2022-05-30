import { Dispatch, SetStateAction, useState } from 'react'
import {
    matchStateEoG,
    matchStateForUnlimitedMatch,
    MatchStateInPlay,
} from 'tsgammon-core/dispatchers/MatchState'
import { GameConf } from 'tsgammon-core/GameConf'
import {
    addPlyRecord,
    discardCurrentGame,
    matchRecord as initMatchRecord,
    MatchRecord,
    recordFinishedGame,
    eogRecord,
    trimPlyRecords,
} from 'tsgammon-core/records/MatchRecord'
import { PlyRecordEoG, PlyRecordInPlay } from 'tsgammon-core/records/PlyRecord'

export type MatchRecorder<T> = {
    recordPly: (plyRecord: PlyRecordInPlay, lastState: T) => void
    recordEoG: (plyRecord: PlyRecordEoG) => void
    resetCurGame: () => void
    resumeTo: (index: number) => T
}

/**
 * MatchRecordを管理するHook
 *
 * 対局状態の変化、指し手の追加によってゲームの進行と同時に記録も更新される。
 */
export function useMatchRecorder<T>(
    conf: GameConf,
    initialMatchState?: MatchStateInPlay,
    initialMatchRecord?: MatchRecord<T>
): [
    MatchRecord<T>,
    MatchRecorder<T>,
    Dispatch<SetStateAction<MatchRecord<T>>>
] {
    const [matchRecord, setMatchRecord] = useState<MatchRecord<T>>(
        initialMatchRecord ??
            initMatchRecord(
                conf,
                initialMatchState ?? matchStateForUnlimitedMatch()
            )
    )

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
            const { stake, eogStatus } = eogPlyRecord
            const matchState = matchStateEoG(prev.matchState, stake, eogStatus)
            return eogRecord(prev, matchState, eogPlyRecord)
        })
    }

    function resetCurGame() {
        setMatchRecord((prev) =>
            prev.isEoG ? recordFinishedGame(prev) : discardCurrentGame(prev)
        )
    }

    function resumeTo(index: number): T {
        setMatchRecord((prev) => trimPlyRecords(prev, index))
        return matchRecord.curGameRecord.plyRecords[index].state
    }

    const matchRecorder: MatchRecorder<T> = {
        recordEoG,
        resetCurGame,
        recordPly,
        resumeTo,
    }

    return [matchRecord, matchRecorder, setMatchRecord]
}
