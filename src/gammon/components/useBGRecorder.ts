import { Score } from 'tsgammon-core'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { GameConf } from 'tsgammon-core/GameConf'
import { MatchState } from 'tsgammon-core/MatchState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { matchRecorderAsBG } from 'tsgammon-core/records/MatchRecorder'
import { useMatchRecorder } from './recordedGames/useMatchRecorder'
import { initMatchState, useMatchState } from './useMatchState'

export type BGRecorder = {
    matchState: MatchState
    matchListener: Partial<BGListener>
} & (
    | {
          recordMatch: true
          matchRecord: MatchRecord<BGState>
          onResumeState: (index: number) => void
      }
    | { recordMatch: false }
)
export type BGRecorderHookProps = {
    gameConf: GameConf
    matchLength: number
    matchScore: Score
    isCrawford: boolean
} & (
    | {
          recordMatch: false
          setBGState?: undefined
      }
    | { recordMatch: true; setBGState: (state: BGState) => void }
)

export function useBGRecorder(conf: BGRecorderHookProps): BGRecorder {
    const {
        gameConf,
        matchLength,
        matchScore,
        isCrawford,
        recordMatch,
        setBGState,
    } = conf

    const initialMatchState = initMatchState({
        stakeConf: gameConf,
        matchLength,
        matchScore,
        isCrawford,
    })
    // マッチの状態管理のみを行う
    const { matchState, matchStateListener, resetMatchState } =
        useMatchState(initialMatchState)

    // マッチの記録を行う
    const { matchRecord, matchRecorder } = useMatchRecorder<BGState>(
        gameConf,
        initialMatchState
    )
    const matchRecorderListener = matchRecorderAsBG(
        gameConf,
        matchRecorder
    )
    const bgRecorder = recordMatch
        ? {
              recordMatch,
              matchState: matchRecord.matchState,
              matchListener: matchRecorderListener,
              matchRecord,
              // 記録された状態からの復元
              onResumeState: (index: number) => {
                  const { state } = matchRecorder.resumeTo(index)
                  setBGState(state)
                  // ここでautoOperationも実行しないといけないが、手を変更できたほうが便利だろう
              },
          }
        : {
              recordMatch,
              matchState,
              matchListener: matchStateListener,
              resetMatchLength: (_: GameConf, matchLength: number) =>
                  resetMatchState(matchLength),
          }
    return bgRecorder
}
