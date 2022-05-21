import { BoardStateNode, DiceRoll } from 'tsgammon-core'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners, SingleGameDispatcher, singleGameDispatcher } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGInPlay,
    SGOpening,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState'
import { EventHandlerBuilder } from './EventHandlerBuilder'

export type SingleGameEventHandlers = {
    onStartGame: () => void

    onCommit: (sgState: SGInPlay, node: BoardStateNode) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void
}


export type SGEventHandlerBuilder = EventHandlerBuilder<
    SingleGameEventHandlers,
    SingleGameListeners
>
export function sgEventHandlersBuilder(
    rollListener: RollListener
): SGEventHandlerBuilder {
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

export function concatSGHandlers(
    h: Partial<SingleGameEventHandlers>,
    eventHandlers: Partial<SingleGameEventHandlers>
): SingleGameEventHandlers {
    return {
        onStartGame: () => {
            if (eventHandlers.onStartGame) {
                eventHandlers.onStartGame()
            }
            if (h.onStartGame) {
                h.onStartGame()
            }
        },
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            if (eventHandlers.onCommit) {
                eventHandlers.onCommit(sgState, node)
            }
            if (h.onCommit) {
                h.onCommit(sgState, node)
            }
        },
        onRoll: (sgState: SGToRoll) => {
            if (eventHandlers.onRoll) {
                eventHandlers.onRoll(sgState)
            }
            if (h.onRoll) {
                h.onRoll(sgState)
            }
        },
        onRollOpening: (sgState: SGOpening) => {
            if (eventHandlers.onRollOpening) {
                eventHandlers.onRollOpening(sgState)
            }
            if (h.onRollOpening) {
                h.onRollOpening(sgState)
            }
        },
    }
}
