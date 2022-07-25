import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameConf } from 'tsgammon-core/GameConf'
import { matchRecorderAsSG } from 'tsgammon-core/records/MatchRecorder'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { SGRecorder } from './Cubeless'
import { score } from 'tsgammon-core'
import { initMatchState } from '../useMatchState'

export function useSGRecorder(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    recordMatch: boolean
): {
    matchRecordListener: Partial<SingleGameListener>
    sgRecorder: SGRecorder
} {
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
