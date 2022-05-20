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
import { SingleGameEventHandlers } from './EventHandlers'

export function singleGameListeners(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
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

export function singleGameEventHandlers(
    rollListener: RollListener
): (addOn: {
    eventHandlers: Partial<SingleGameEventHandlers>
    listeners: Partial<SingleGameListeners>
}) => SingleGameEventHandlers {
    const dispatcher: SingleGameDispatcher = singleGameDispatcher()
    return (addOn: {
        eventHandlers: Partial<SingleGameEventHandlers>
        listeners: Partial<SingleGameListeners>
    }) => {
        const { eventHandlers, listeners } = addOn
        return {
            onStartGame: () => {
                if (eventHandlers.onStartGame) {
                    eventHandlers.onStartGame()
                }
                const result = dispatcher.doStartGame()
                result(listeners)
            },
            onCommit: (state, node) => {
                if (eventHandlers.onCommit) {
                    eventHandlers.onCommit(state, node)
                }
                const result = dispatcher.doCommitCheckerPlay(state, node)
                result(listeners)
            },
            onRoll: (sgState: SGToRoll) =>
                rollListener.onRollRequest((dices: DiceRoll) => {
                    if (eventHandlers.onRoll) {
                        eventHandlers.onRoll(sgState)
                    }
                    const result = dispatcher.doRoll(sgState, dices)
                    result(listeners)
                }),
            onRollOpening: (sgState: SGOpening) =>
                rollListener.onRollRequest((dices: DiceRoll) => {
                    if (eventHandlers.onRollOpening) {
                        eventHandlers.onRollOpening(sgState)
                    }
                    const result = dispatcher.doOpeningRoll(sgState, dices)
                    result(listeners)
                }),
        }
    }
}
