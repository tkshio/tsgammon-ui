import { GameConf, score } from 'tsgammon-core'
import { SGState } from 'tsgammon-core/states/SingleGameState'

import { initMatchState } from '../useMatchState'
import { matchRecordingSGListener } from './MatchRecordingListeners'
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

    const matchRecordListener = matchRecordingSGListener(matchRecorder)

    return { matchRecord, matchRecorder, matchRecordListener }
}
