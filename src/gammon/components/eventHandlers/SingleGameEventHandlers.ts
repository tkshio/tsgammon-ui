import { BoardStateNode, DiceRoll } from 'tsgammon-core'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    SingleGameListeners,
    SingleGameDispatcher,
    concatSGListeners,
    setSGStateListener,
    singleGameDispatcher,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import {
    EventHandlerAddOn,
    EventHandlerBuilder,
    wrap,
} from './EventHandlerBuilder'
import {
    concat0,
    concat1,
    concat2,
} from 'tsgammon-core/dispatchers/utils/concat'

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
    rollListener: RollListener = rollListeners(),
    ...addOns: SGEventHandlerAddOn[]
): {
    handlers: SingleGameEventHandlers
} {
    const sgDispatcher = singleGameDispatcher()
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
    return builder

    function builder(addOn: {
        eventHandlers: Partial<SingleGameEventHandlers>
        listeners: Partial<SingleGameListeners>
    }) {
        const { eventHandlers, listeners } = addOn
        return {
            handlers: concatSGHandlers(eventHandlers, {
                onStartGame: () => {
                    const result = dispatcher.doStartGame()
                    result(listeners)
                },
                onCommit: (state, node) => {
                    const result = dispatcher.doCommitCheckerPlay(state, node)
                    result(listeners)
                },
                onRoll: (sgState: SGToRoll) =>
                    rollListener.onRollRequest((dices: DiceRoll) => {
                        const result = dispatcher.doRoll(sgState, dices)
                        result(listeners)
                    }),
                onRollOpening: (sgState: SGOpening) =>
                    rollListener.onRollRequest((dices: DiceRoll) => {
                        const result = dispatcher.doOpeningRoll(sgState, dices)
                        result(listeners)
                    }),
            }) as SingleGameEventHandlers,
            listeners,
        }
    }
}

function concatSGHandlers(
    base: Partial<SingleGameEventHandlers>,
    ...handlers: Partial<SingleGameEventHandlers>[]
): Partial<SingleGameEventHandlers> {
    return handlers.reduce(
        (
            prev: Partial<SingleGameEventHandlers>,
            cur: Partial<SingleGameEventHandlers>
        ): Partial<SingleGameEventHandlers> => {
            return {
                onStartGame: concat0(prev?.onStartGame, cur?.onStartGame),
                onCommit: concat2(prev?.onCommit, cur?.onCommit),
                onRoll: concat1(prev?.onRoll, cur?.onRoll),
                onRollOpening: concat1(prev?.onRollOpening, cur?.onRollOpening),
            }
        },
        base
    )
}
