import { Dispatch, SetStateAction, useState } from "react";
import { standardConf } from "tsgammon-core/GameConf";
import { GameRecordInPlay, initGameRecord } from "tsgammon-core/records/GameRecord";
import { addPlyRecord, MatchRecord, recordFinishedGame, setEoGRecord, trimPlyRecords } from "tsgammon-core/records/MatchRecord";
import { PlyRecordEoG, PlyRecordInPlay } from "tsgammon-core/records/PlyRecord";
import { score } from "tsgammon-core/Score";


export type MatchRecorder<T> = {
    recordPly: (plyRecord: PlyRecordInPlay, lastState: T) => void
    recordEoG: (plyRecord: PlyRecordEoG) => void
    resetCurGame: () => void
    resumeTo: (index: number) => void
}

/**
 * MatchRecordを管理するHook
 *
 * 対局状態の変化、指し手の追加によってゲームの進行と同時に記録も更新される。
 */
export function useMatchRecorder<T>(
    records?: { matchRecord?: MatchRecord<T>, curGameRecord?: GameRecordInPlay<T> })
    : [MatchRecord<T>, MatchRecorder<T>, Dispatch<SetStateAction<MatchRecord<T>>>] {
    const initialMatchRecord: MatchRecord<T> = (records?.matchRecord) ?? {
        conf: standardConf,
        gameRecords: [],
        score: score(),
        matchLength: 0,
        curGameRecord: initGameRecord(score()),
    }
    const [matchRecord, setMatchRecord] = useState<MatchRecord<T>>(initialMatchRecord)

    function recordPly(plyRecord: PlyRecordInPlay, state: T) {
        setMatchRecord((prev: MatchRecord<T>) => addPlyRecord(prev, plyRecord, state))
    }

    function recordEoG(eogRecord: PlyRecordEoG) {
        setMatchRecord((prev: MatchRecord<T>): MatchRecord<T> => setEoGRecord(prev, eogRecord))
    }

    function resetCurGame() {
        setMatchRecord(prev => recordFinishedGame(prev))
    }

    function resumeTo(index: number): void {
        setMatchRecord(prev => trimPlyRecords(prev, index))
    }

    const matchRecorder: MatchRecorder<T> = {
        recordEoG, resetCurGame, recordPly, resumeTo
    }

    return [matchRecord, matchRecorder, setMatchRecord]
}

