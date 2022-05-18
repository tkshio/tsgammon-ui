import { useState } from 'react'
import { score } from 'tsgammon-core'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { StartNextGameHandler } from './EventHandlers'
import { MatchState, matchStateEOG, MatchStateInPlay } from './MatchState'

export function useMatchStateForCubeGame(
    matchLength = 0,
    stakeConf: StakeConf = { jacobyRule: false }
): {
    matchState: MatchState
    matchStateListener: Pick<CubeGameListeners, 'onEndOfCubeGame'>
    matchStateEventHandler: StartNextGameHandler
} {
    const [matchState, setMatchState] = useState<MatchState>({
        isEoG: false,
        matchLength,
        scoreBefore: score(),
        stakeConf,
        isCrawford: matchLength === 1,
    })
    const onEndOfCubeGame = (cbEoG: CBEoG) => {
        setMatchState((prev: MatchState) => matchStateEOG(prev, cbEoG))
    }
    const onStartNextGame = () => {
        setMatchState((prev: MatchState) => matchStateNext(prev))
    }
    return {
        matchState,
        matchStateListener: { onEndOfCubeGame },
        matchStateEventHandler: { onStartNextGame },
    }
}

export function matchStateNext(prev: MatchState): MatchStateInPlay {
    return prev.isEoG
        ? {
              isEoG: false,
              matchLength: prev.matchLength,
              scoreBefore: prev.scoreAfter,
              stakeConf: prev.stakeConf,
              isCrawford: prev.isCrawfordNext,
          }
        : prev
}
