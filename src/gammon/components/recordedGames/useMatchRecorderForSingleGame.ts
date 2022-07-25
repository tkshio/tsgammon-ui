import { GameConf, score } from 'tsgammon-core'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { matchRecorderAsSG } from 'tsgammon-core/records/MatchRecorder'
import { initMatchState } from '../useMatchState'
import { useMatchRecorder } from './useMatchRecorder'

export function useMatchRecorderForSingleGame(gameConf: GameConf) {
    const { matchRecord, matchRecorder } = useMatchRecorder<SGState>(
        gameConf,
        initMatchState({
            stakeConf: gameConf,
            matchScore: score(),
            matchLength: 0,
            isCrawford: false,
        })
    )

    const matchRecordListener = matchRecorderAsSG(matchRecorder)

    return { matchRecord, matchRecorder, matchRecordListener }
}
