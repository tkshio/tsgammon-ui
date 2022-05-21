import { useState } from 'react'
import { boardState, DiceRoll, GameConf } from 'tsgammon-core'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    setSGStateListener,
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    openingState,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { EventHandlerBuilder } from './EventHandlerBuilder'
import { SingleGameEventHandlers } from './SingleGameEventHandlers'

export function singleGameListeners(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void
): SingleGameListeners {
    const defaultState = openingState(boardState(gameConf.initialPos))
    return setSGStateListener(defaultState, setSGState)
}

export function useSingleGameState(initialSGState: SGState): {
    sgState: SGState
    setSGState: (sgState: SGState) => void
} {
    const [sgState, setSGState] = useState(initialSGState)
    return {
        sgState,
        setSGState,
    }
}
