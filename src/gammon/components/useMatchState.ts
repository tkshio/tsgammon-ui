import { useState } from 'react'
import { Score, score } from 'tsgammon-core'
import {
    MatchState,
    MatchStateEoG,
    matchStateEoG,
    MatchStateInPlay,
} from 'tsgammon-core/MatchState'
import { StakeConf } from 'tsgammon-core/StakeConf'
import { CBEoG } from 'tsgammon-core/states/CubeGameState'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { BGListener } from './dispatchers/BGListener'

export function useMatchState(conf: {
    stakeConf?: StakeConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
}): {
    matchState: MatchState
    matchStateListener: Partial<BGListener>
    resetMatchState: (matchLength: number) => void
} {
    const {
        stakeConf = { jacobyRule: false },
        matchLength = 0,
        matchScore = score(),
        isCrawford = false,
    } = conf
    const [matchState, setMatchState] = useState<MatchState>(
        initMatchState({ stakeConf, matchScore, matchLength, isCrawford })
    )

    return {
        matchState,
        resetMatchState,
        matchStateListener: matchStateListener(matchState, setMatchState),
    }

    function resetMatchState(matchLength: number) {
        setMatchState(
            initMatchState({
                stakeConf,
                matchScore: score(),
                matchLength,
                isCrawford: false,
            })
        )
    }
}
export function initMatchState(args: {
    stakeConf: StakeConf
    matchScore: Score
    matchLength: number
    isCrawford: boolean
}): MatchStateInPlay {
    const { stakeConf, matchScore, matchLength, isCrawford } = args
    return {
        isEoG: false,
        matchLength,
        scoreBefore: matchScore,
        score: matchScore,
        stakeConf,
        isCrawford: isCrawford || matchLength === 1,
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
