import { useState } from 'react'
import { Score, score } from 'tsgammon-core'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import {
    CubeGameEventHandlerAddOn
} from './eventHandlers/CubeGameEventHandlers'
import { MatchState, matchStateEOG, MatchStateInPlay } from './MatchState'

export function useMatchStateForCubeGame(
    matchScore:Score = score(),
    matchLength = 0,
    stakeConf: StakeConf = { jacobyRule: false }
): {
    matchState: MatchState
    matchStateAddOn: CubeGameEventHandlerAddOn
    resetMatchState: () => void
} {
    const [matchState, setMatchState] = useState<MatchState>({
        isEoG: false,
        matchLength,
        scoreBefore: matchScore,
        stakeConf,
        isCrawford: matchLength === 1,
    })
    const { eventHandlers, listeners, resetMatchState } =
        matchStateAddOn(matchState, setMatchState)

    return {
        matchState,
        resetMatchState,
        matchStateAddOn: {
            eventHandlers,
            listeners,
        },
    }
}
export function matchStateAddOn(
    matchState: MatchState,
    setMatchState: (matchState: MatchState) => void
) {
    const onEndOfCubeGame = (cbEoG: CBEoG) => {
        setMatchState(matchStateEOG(matchState, cbEoG))
    }
    const onStartCubeGame = () => {
        setMatchState(matchStateNext(matchState))
    }
    const resetMatchState = () => {
        if (matchState.isEoG) {
            const resetState: MatchStateInPlay = {
                ...matchState,
                isEoG: false,
            }
            setMatchState(resetState)
        }
    }
    return {
        listeners: { onEndOfCubeGame },
        eventHandlers: { onStartCubeGame },
        resetMatchState,
    }
}

export function matchStateNext(prev: MatchState): MatchStateInPlay {
    return prev.isEoG
        ? prev.isEoM
            ? {
                  isEoG: false,
                  matchLength: prev.matchLength,
                  scoreBefore: score(),
                  stakeConf: prev.stakeConf,
                  isCrawford: prev.matchLength === 1,
              }
            : {
                  isEoG: false,
                  matchLength: prev.matchLength,
                  scoreBefore: prev.scoreAfter,
                  stakeConf: prev.stakeConf,
                  isCrawford: prev.isCrawfordNext,
              }
        : prev
}
