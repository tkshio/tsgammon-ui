import { Dispatch, SetStateAction, useState } from 'react'
import { GameConf } from 'tsgammon-core/GameConf'

import {
    addPlyRecord,
    MatchRecord,
    matchRecord as initMatchRecord,
    recordFinishedGame,
    setEoGRecord,
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
    initialMatchRecord?: MatchRecord<T>
): [
    MatchRecord<T>,
    MatchRecorder<T>,
    Dispatch<SetStateAction<MatchRecord<T>>>
] {
    const [matchRecord, setMatchRecord] = useState<MatchRecord<T>>(
        initialMatchRecord ?? initMatchRecord(conf, 0)
    )

    function recordPly(plyRecord: PlyRecordInPlay, state: T) {
        setMatchRecord(addPlyRecord(matchRecord, plyRecord, state))
    }

    function recordEoG(eogRecord: PlyRecordEoG) {
        setMatchRecord(setEoGRecord(matchRecord, eogRecord))
    }

    function resetCurGame() {
        setMatchRecord(recordFinishedGame(matchRecord))
    }

    function resumeTo(index: number): T {
        setMatchRecord(trimPlyRecords(matchRecord, index))
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
