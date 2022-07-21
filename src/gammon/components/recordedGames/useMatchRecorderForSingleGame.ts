import { GameConf } from 'tsgammon-core'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { matchRecorderAsSG } from 'tsgammon-core/records/MatchRecorder'
import { useMatchRecorder } from './useMatchRecorder'

export function useMatchRecorderForSingleGame(gameConf: GameConf) {
    const { matchRecord, matchRecorder } = useMatchRecorder<SGState>(
        gameConf,
        0
    )

    const matchRecordListener = matchRecorderAsSG(matchRecorder)

    return { matchRecord, matchRecorder, matchRecordListener }
}
