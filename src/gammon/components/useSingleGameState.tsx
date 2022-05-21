import { useState } from 'react'
import { boardState, GameConf } from 'tsgammon-core'
import {
    setSGStateListener, SingleGameListeners
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    openingState, SGState
} from 'tsgammon-core/dispatchers/SingleGameState'

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
