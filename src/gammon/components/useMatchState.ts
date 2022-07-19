import { useState } from 'react'
import { Score, score } from 'tsgammon-core'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import {
    MatchState,
    MatchStateEoG,
    matchStateEoG,
    MatchStateInPlay,
} from 'tsgammon-core/dispatchers/MatchState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'

export function useMatchState(
    matchScore: Score = score(),
    matchLength = 0,
    stakeConf: StakeConf = { jacobyRule: false }
): {
    matchState: MatchState
    initialMatchState: MatchStateInPlay
    matchStateAddOn: Partial<BGListener>
    resetMatchState: () => void
} {
    const initialMatchState: MatchStateInPlay = {
        isEoG: false,
        matchLength,
        scoreBefore: matchScore,
        score: matchScore,
        stakeConf,
        isCrawford: matchLength === 1,
    }
    const [matchState, setMatchState] = useState<MatchState>(initialMatchState)

    return {
        matchState,
        initialMatchState,
        resetMatchState,
        matchStateAddOn: matchStateAddOn(matchState, setMatchState),
    }
    function resetMatchState() {
        if (matchState.isEoG) {
            const resetState: MatchStateInPlay = {
                ...matchState,
                isEoG: false,
            }
            setMatchState(resetState)
        }
    }
}
export function matchStateAddOn(
    matchState: MatchState,
    setMatchState: (matchState: MatchState) => void
): Partial<BGListener> {
    const onEndOfBGGame = (bgState:{cbState: CBEoG, sgState:SGState}) => {
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
