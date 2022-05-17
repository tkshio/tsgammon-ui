import { useState } from 'react'
import { boardState, DiceRoll, GameConf } from 'tsgammon-core'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate,
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
import { SingleGameEventHandlers } from './EventHandlers'

export function singleGameListeners(
    setSGState: (sgState?: SGState) => void,
    ...listeners: Partial<SingleGameListeners>[]
): SingleGameListeners {
    return decorate(setSGStateListener(setSGState), ...listeners)
}

export function useSingleGameState(
    gameConf: GameConf,
    initialSGState: SGState,
): {
    sgState: SGState
    setSGState: (sgState?: SGState) => void
} {
    const defaultState = openingState(boardState(gameConf.initialPos))
    const [sgState, setSGState] = useState(initialSGState)
    return {
        sgState,
        setSGState: (state: SGState = defaultState) => setSGState(state),
    }
} 
export function singleGameEventHandlers(
    rollListener: RollListener,
    sgListeners: SingleGameListeners
): SingleGameEventHandlers {
    const dispatcher: SingleGameDispatcher = singleGameDispatcher(sgListeners)
    return {
        onCommit: dispatcher.doCommitCheckerPlay,
        onRoll: (sgState: SGToRoll) =>
            rollListener.onRollRequest((dices: DiceRoll) => {
                dispatcher.doRoll(sgState, dices)
            }),
        onRollOpening: (sgState: SGOpening) =>
            rollListener.onRollRequest((dices: DiceRoll) =>
                dispatcher.doOpeningRoll(sgState, dices)
            ),
    }
}
