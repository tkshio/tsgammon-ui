import {
    addPlyRecord,
    discardCurrentGame,
    eogRecord,
    MatchRecord,
    recordFinishedGame,
    trimPlyRecords,
} from 'tsgammon-core/records/MatchRecord'
import { PlyRecordEoG, PlyRecordInPlay } from 'tsgammon-core/records/PlyRecord'
import { PlyStateRecord } from 'tsgammon-core/records/PlyStateRecord'

export type MatchRecorder<T> = {
    recordPly: (plyRecord: PlyRecordInPlay, lastState: T) => void
    recordEoG: (plyRecord: PlyRecordEoG) => void
    resetCurGame: () => void
    resumeTo: (index: number) => PlyStateRecord<T>
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
