import { Dispatch, SetStateAction, useState } from 'react'
import { GameConf } from 'tsgammon-core/GameConf'
import {
    GameRecordInPlay,
} from 'tsgammon-core/records/GameRecord'
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
    resumeTo: (index: number) => void
}

/**
 * MatchRecordを管理するHook
 *
 * 対局状態の変化、指し手の追加によってゲームの進行と同時に記録も更新される。
 */
export function useMatchRecorder<T>(
    conf:GameConf,
    matchLength?:number,
    records?: {
        matchRecord?: MatchRecord<T>
        curGameRecord?: GameRecordInPlay<T>
    }
): [
    MatchRecord<T>,
    MatchRecorder<T>,
    Dispatch<SetStateAction<MatchRecord<T>>>
] {
    const initialMatchRecord: MatchRecord<T> = records?.matchRecord ?? initMatchRecord(matchLength,conf)
    const [matchRecord, setMatchRecord] =
        useState<MatchRecord<T>>(initialMatchRecord)

    function recordPly(plyRecord: PlyRecordInPlay, state: T) {
        setMatchRecord((prev: MatchRecord<T>) =>
            addPlyRecord(prev, plyRecord, state)
        )
    }

    function recordEoG(eogRecord: PlyRecordEoG) {
        setMatchRecord(
            (prev: MatchRecord<T>): MatchRecord<T> =>
                setEoGRecord(prev, eogRecord)
        )
    }

    function resetCurGame() {
        setMatchRecord((prev) => recordFinishedGame(prev))
    }

    function resumeTo(index: number): void {
        setMatchRecord((prev) => trimPlyRecords(prev, index))
    }

    const matchRecorder: MatchRecorder<T> = {
        recordEoG,
        resetCurGame,
        recordPly,
        resumeTo,
    }

    return [matchRecord, matchRecorder, setMatchRecord]
}
