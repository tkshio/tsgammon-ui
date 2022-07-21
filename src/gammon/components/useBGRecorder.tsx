import { score } from 'tsgammon-core'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { GameConf } from 'tsgammon-core/GameConf'
import { MatchState } from 'tsgammon-core/MatchState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import {
    MatchRecorder,
    matchRecorderAsBG,
} from 'tsgammon-core/records/MatchRecorder'
import { useMatchRecorder } from './recordedGames/useMatchRecorder'
import { useMatchState } from './useMatchState'

export type BGRecorder = {
    matchState: MatchState
    matchListener: Partial<BGListener>
    resetMatchLength: (gameConf: GameConf, matchLength: number) => void
} & (
    | {
          recordMatch: true
          matchRecorder: MatchRecorder<BGState>
          matchRecord: MatchRecord<BGState>
      }
    | { recordMatch: false }
)
export function useBGRecorder(
    recordMatch: boolean,
    gameConf: GameConf,
    matchLength: number
): (recordMatch: boolean) => BGRecorder {
    // マッチの状態管理のみを行う
    const { matchState, matchStateListener, resetMatchState } = useMatchState(
        score(),
        matchLength,
        gameConf
    )

    // マッチの記録を行う
    const { matchRecord, matchRecorder, resetMatchRecord } =
        useMatchRecorder<BGState>(gameConf, matchLength)
    const matchRecordListener = matchRecorderAsBG(gameConf, matchRecorder)
    return (recordMatch: boolean) =>
        recordMatch
            ? {
                  recordMatch,
                  matchState: matchRecord.matchState,
                  matchListener: matchRecordListener,
                  matchRecord,
                  matchRecorder,
                  resetMatchLength: resetMatchRecord,
              }
            : {
                  recordMatch,
                  matchState,
                  matchListener: matchStateListener,
                  resetMatchLength: (_: GameConf, matchLength: number) =>
                      resetMatchState(matchLength),
              }
}
