import { useState } from 'react'
import { GameConf } from 'tsgammon-core'
import { MatchStateInPlay } from 'tsgammon-core/MatchState'
import {
    MatchRecord,
    matchRecordInPlay
} from 'tsgammon-core/records/MatchRecord'
import { buildMatchRecorder, MatchRecorder } from 'tsgammon-core/records/MatchRecorder'

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
} {
    const [matchRecord, setMatchRecord] = useState<MatchRecord<T>>(
        matchRecordInPlay(gameConf, initialMatchState)
    )
    const matchRecorder = buildMatchRecorder(matchRecord, setMatchRecord)
    return {matchRecord, matchRecorder}
}