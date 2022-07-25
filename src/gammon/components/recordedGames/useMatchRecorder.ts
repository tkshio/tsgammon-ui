import { Dispatch, SetStateAction, useState } from 'react'
import { GameConf, Score, score } from 'tsgammon-core'
import { MatchStateInPlay, matchStateForUnlimitedMatch, matchStateForPointMatch } from 'tsgammon-core/MatchState'
import {
    addPlyRecord,
    discardCurrentGame, eogRecord, MatchRecord,
    matchRecordInPlay,
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
export 
function useMatchRecorder<T>(
    gameConf:GameConf,
    initialMatchState:MatchStateInPlay
): {
    matchRecord: MatchRecord<T>
    matchRecorder: MatchRecorder<T>
    setMatchRecord: Dispatch<SetStateAction<MatchRecord<T>>>
    resetMatchRecord: (gameConf: GameConf, matchLength: number) => void
} {
    const [matchRecord, setMatchRecord] = useState<MatchRecord<T>>(
        matchRecordInPlay(gameConf, initialMatchState)
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

    function resetMatchRecord(gameConf: GameConf, matchLength: number) {
        const initialMatchState = matchStateInPlay(gameConf, matchLength)
        setMatchRecord(matchRecordInPlay(gameConf, initialMatchState))
    }
    const matchRecorder: MatchRecorder<T> = {
        recordEoG,
        resetCurGame,
        recordPly,
        resumeTo,
    }

    return { matchRecord, matchRecorder, setMatchRecord, resetMatchRecord }
}

function matchStateInPlay(
    gameConf: GameConf,
    matchLength: number,
    initScore: Score = score()
): MatchStateInPlay {
    return matchLength === 0
        ? matchStateForUnlimitedMatch(initScore, gameConf.jacobyRule)
        : matchStateForPointMatch(matchLength, initScore, matchLength === 1)
}
