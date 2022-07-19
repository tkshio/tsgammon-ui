import { GameConf } from 'tsgammon-core'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/MatchState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { matchRecordInPlay } from 'tsgammon-core/records/MatchRecord'
import { matchRecorderAsSGAddOn } from "tsgammon-core/records/MatchRecorder"
import { useMatchRecorder } from './useMatchRecorder'

export function useMatchRecorderForSingleGame(gameConf: GameConf) {
    const initialMatchState = matchStateForUnlimitedMatch()
    const initialMatchRecord = matchRecordInPlay<SGState>(
        gameConf,
        initialMatchState
    )

    const [matchRecord, matchRecorder] =
        useMatchRecorder<SGState>(initialMatchRecord)

    const matchRecordAddOn = matchRecorderAsSGAddOn(matchRecorder)

    return { matchRecord, matchRecorder, matchRecordAddOn }
}

