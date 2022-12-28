import { Score } from 'tsgammon-core'
import { GameConf } from 'tsgammon-core/GameConf'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { SingleGameListener } from '../dispatchers/SingleGameListener'
import { matchRecorderAsSG } from '../recordedGames/MatchRecorder'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { initMatchState } from '../useMatchState'
import { SGRecorder } from './Cubeless'

export function useSGRecorder(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    recordMatch: boolean,
    matchScore: Score
): {
    matchRecordListener: Partial<SingleGameListener>
    sgRecorder: SGRecorder
} {
    const { matchRecord, matchRecorder } = useMatchRecorder<SGState>(
        gameConf,
        initMatchState({
            stakeConf: gameConf,
            matchScore: matchScore,
            matchLength: 0,
            isCrawford: false,
        })
    )

    const matchRecordListener = matchRecorderAsSG(matchRecorder)
    const sgRecorder = {
        recordMatch,
        onResumeState: (index: number) => {
            const resumed = matchRecorder.resumeTo(index)
            setSGState(resumed.state)
        },
        matchRecord,
    }
    return { matchRecordListener, sgRecorder }
}
