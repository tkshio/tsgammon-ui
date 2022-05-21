import { BoardStateNode, DiceRoll } from 'tsgammon-core'
import { RollListener, rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    SingleGameListeners,
    SingleGameDispatcher,
    concatSGListeners,
    setSGStateListener,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { EventHandlerAddOn, EventHandlerBuilder, wrap } from './EventHandlerBuilder'

export type SingleGameEventHandlers = {
    onStartGame: () => void

    onCommit: (sgState: SGInPlay, node: BoardStateNode) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void
}

export type SGEventHandlerAddOn = EventHandlerAddOn<
    SingleGameEventHandlers,
    SingleGameListeners
>

export type SGEventHandlerBuilder = EventHandlerBuilder<
    SingleGameEventHandlers,
    SingleGameListeners
>


export function buildSGEventHandlers(
    defaultSGState: SGState,
    setSGState: (sgState: SGState) => void,
    sgDispatcher: SingleGameDispatcher,
    rollListener: RollListener = rollListeners(),
    ...addOns: SGEventHandlerAddOn[]
): {
    handlers: SingleGameEventHandlers
} {
    const builder = sgEventHandlersBuilder(sgDispatcher, rollListener)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, concatSGHandlers, concatSGListeners)
    )

    return finalBuilder.build(setSGStateListener(defaultSGState, setSGState))
}
export function sgEventHandlersBuilder(
    dispatcher: SingleGameDispatcher,
    rollListener: RollListener
): SGEventHandlerBuilder {
    return (addOn: {
        eventHandlers: Partial<SingleGameEventHandlers>
        listeners: Partial<SingleGameListeners>
    }) => {
        const { eventHandlers, listeners } = addOn
        return {
            handlers: {
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
            },
            dispatcher,
        }
    }
}

function concatSGHandlers(
    base: Partial<SingleGameEventHandlers>,
    eventHandlers: Partial<SingleGameEventHandlers>
): SingleGameEventHandlers {
    return {
        onStartGame: () => {
            if (eventHandlers.onStartGame) {
                eventHandlers.onStartGame()
            }
            if (base.onStartGame) {
                base.onStartGame()
            }
        },
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            if (eventHandlers.onCommit) {
                eventHandlers.onCommit(sgState, node)
            }
            if (base.onCommit) {
                base.onCommit(sgState, node)
            }
        },
        onRoll: (sgState: SGToRoll) => {
            if (eventHandlers.onRoll) {
                eventHandlers.onRoll(sgState)
            }
            if (base.onRoll) {
                base.onRoll(sgState)
            }
        },
        onRollOpening: (sgState: SGOpening) => {
            if (eventHandlers.onRollOpening) {
                eventHandlers.onRollOpening(sgState)
            }
            if (base.onRollOpening) {
                base.onRollOpening(sgState)
            }
        },
    }
}
