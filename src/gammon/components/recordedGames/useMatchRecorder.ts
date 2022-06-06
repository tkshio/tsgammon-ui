import { Dispatch, SetStateAction, useState } from 'react'
import {
    addPlyRecord,
    discardCurrentGame, eogRecord, MatchRecord,
    recordFinishedGame, trimPlyRecords
} from 'tsgammon-core/records/MatchRecord'
import { MatchRecorder } from 'tsgammon-core/records/MatchRecorder'
import { PlyRecordEoG, PlyRecordInPlay } from 'tsgammon-core/records/PlyRecord'
import { PlyStateRecord } from 'tsgammon-core/records/PlyStateRecord'

/**
 * MatchRecordを管理するHook
 *
 * 対局状態の変化、指し手の追加によってゲームの進行と同時に記録も更新される。
 */
export function useMatchRecorder<T>(
    initialMatchRecord: MatchRecord<T>
): [
    MatchRecord<T>,
    MatchRecorder<T>,
    Dispatch<SetStateAction<MatchRecord<T>>>
] {
    const [matchRecord, setMatchRecord] =
        useState<MatchRecord<T>>(initialMatchRecord)

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

    const matchRecorder: MatchRecorder<T> = {
        recordEoG,
        resetCurGame,
        recordPly,
        resumeTo,
    }

    return [matchRecord, matchRecorder, setMatchRecord]
}
