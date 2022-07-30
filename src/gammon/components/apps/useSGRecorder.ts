import { Score } from 'tsgammon-core'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameConf } from 'tsgammon-core/GameConf'
import { matchRecorderAsSG } from 'tsgammon-core/records/MatchRecorder'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { initMatchState } from '../useMatchState'
import { SGRecorder } from './Cubeless'

export function useSGRecorder(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    recordMatch: boolean,
    matchScore:Score
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
