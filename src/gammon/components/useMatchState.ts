import { useState } from 'react'
import { Score, score } from 'tsgammon-core'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    MatchState,
    MatchStateEoG,
    matchStateEoG,
    MatchStateInPlay,
} from 'tsgammon-core/MatchState'
import { StakeConf } from 'tsgammon-core/StakeConf'

export function useMatchState(
    stakeConf: StakeConf = { jacobyRule: false },
    matchLength: number,
    matchScore: Score = score(),
    isCrawford = false
): {
    matchState: MatchState
    matchStateListener: Partial<BGListener>
    resetMatchState: (matchLength: number) => void
} {
    const [matchState, setMatchState] = useState<MatchState>(
        initialMatchState(matchScore, matchLength, isCrawford)
    )

    return {
        matchState,
        resetMatchState,
        matchStateListener: matchStateListener(matchState, setMatchState),
    }

    function initialMatchState(
        matchScore: Score,
        matchLength: number,
        isCrawford: boolean
    ): MatchStateInPlay {
        return {
            isEoG: false,
            matchLength,
            scoreBefore: matchScore,
            score: matchScore,
            stakeConf,
            isCrawford: isCrawford || matchLength === 1,
        }
    }

    function resetMatchState(matchLength: number) {
        setMatchState(initialMatchState(score(), matchLength, false))
    }
}

export function matchStateListener(
    matchState: MatchState,
    setMatchState: (matchState: MatchState) => void
): Partial<BGListener> {
    const onEndOfBGGame = (bgState: { cbState: CBEoG; sgState: SGState }) => {
        setMatchState(eogMatchState(matchState, bgState.cbState))
    }
    const onBGGameStarted = () => {
        setMatchState(nextMatchState(matchState))
    }
    return {
        onEndOfBGGame,
        onBGGameStarted,
    }
}

export function nextMatchState(matchState: MatchState): MatchStateInPlay {
    return matchState.isEoG
        ? matchState.isEoM
            ? {
                  isEoG: false,
                  matchLength: matchState.matchLength,
                  scoreBefore: score(),
                  score: score(),
                  stakeConf: matchState.stakeConf,
                  isCrawford: matchState.matchLength === 1,
              }
            : {
                  isEoG: false,
                  matchLength: matchState.matchLength,
                  scoreBefore: matchState.scoreAfter,
                  score: matchState.scoreAfter,
                  stakeConf: matchState.stakeConf,
                  isCrawford: matchState.isCrawfordNext,
              }
        : matchState
}

export function eogMatchState(
    matchState: MatchState,
    cbEoG: CBEoG
): MatchStateEoG {
    const { stake, eogStatus } = cbEoG.calcStake(matchState.stakeConf)
    return matchStateEoG(matchState, stake, eogStatus)
}
