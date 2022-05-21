import { useState } from 'react'
import { score } from 'tsgammon-core'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { CubeGameEventHandlers } from "./CubeGameEventHandlers"
import { MatchState, matchStateEOG, MatchStateInPlay } from './MatchState'

export function useMatchStateForCubeGame(
    matchLength = 0,
    stakeConf: StakeConf = { jacobyRule: false }
): {
    matchState: MatchState
    matchStateListener: Pick<CubeGameListeners, 'onEndOfCubeGame'>
    matchStateEventHandler: Pick<CubeGameEventHandlers, 'onStartCubeGame'>
    resetMatchState: () => void
} {
    const [matchState, setMatchState] = useState<MatchState>({
        isEoG: false,
        matchLength,
        scoreBefore: score(),
        stakeConf,
        isCrawford: matchLength === 1,
    })
    return {
        matchState,
        ...matchStateEventHandler(matchState, setMatchState),
    }
}
export function matchStateEventHandler(
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
        matchStateListener: { onEndOfCubeGame },
        matchStateEventHandler: { onStartCubeGame },
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
