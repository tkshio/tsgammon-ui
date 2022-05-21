import {
    CubeGameDispatcher,
    CubeGameListeners,
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBAction, CBResponse } from 'tsgammon-core/dispatchers/CubeGameState'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { EventHandlerAddOn, EventHandlerBuilder } from './EventHandlerBuilder'
import { SingleGameEventHandlers } from './SingleGameEventHandlers'

export type CubeGameEventHandlers = {
    onStartCubeGame: () => void

    onTake: (cbState: CBResponse) => void
    onPass: (cbState: CBResponse) => void
    onDouble: (cbState: CBAction) => void
}

export function concatCBEventHandlers(
    base: Partial<CubeGameEventHandlers>,
    ...handlers: Partial<CubeGameEventHandlers>[]
): Partial<CubeGameEventHandlers> {
    const doNothing = () => {
        //
    }
    const filled: CubeGameEventHandlers = {
        onStartCubeGame: doNothing,
        onDouble: doNothing,
        onTake: doNothing,
        onPass: doNothing,
        ...base,
    }

    return handlers.reduce(
        (
            prev: CubeGameEventHandlers,
            cur: Partial<CubeGameEventHandlers>
        ): CubeGameEventHandlers => {
            const { onStartCubeGame, onDouble, onTake, onPass } = cur

            return {
                onStartCubeGame: onStartCubeGame
                    ? () => {
                          prev.onStartCubeGame()
                          onStartCubeGame()
                      }
                    : prev.onStartCubeGame,
                onDouble: onDouble
                    ? (state: CBAction) => {
                          prev.onDouble(state)
                          onDouble(state)
                      }
                    : prev.onDouble,
                onTake: onTake
                    ? (state: CBResponse) => {
                          prev.onTake(state)
                          onTake(state)
                      }
                    : prev.onTake,
                onPass: onPass
                    ? (state: CBResponse) => {
                          prev.onPass(state)
                          onPass(state)
                      }
                    : prev.onPass,
            }
        },
        filled
    )
}

export type CubeGameEventHandlerAddOn = EventHandlerAddOn<
    CubeGameEventHandlers & SingleGameEventHandlers,
    CubeGameListeners & SingleGameListeners
>
export function cbEventHandlersBuilder(
    dispatcher: CubeGameDispatcher
): EventHandlerBuilder<
    CubeGameEventHandlers,
    CubeGameListeners
> {
    return build

    function build(addOn: CubeGameEventHandlerAddOn): {
        handlers: CubeGameEventHandlers
        dispatcher: CubeGameDispatcher
    } {
        const { eventHandlers, listeners } = addOn
        return {
            handlers: {
                onStartCubeGame,
                onDouble,
                onTake,
                onPass,
            },
            dispatcher,
        }

        function onStartCubeGame() {
            if (eventHandlers.onStartCubeGame) {
                eventHandlers.onStartCubeGame()
            }
            const result = dispatcher.doStartCubeGame()
            result(listeners)
        }
        function onDouble(state: CBAction) {
            if (eventHandlers.onDouble) {
                eventHandlers.onDouble(state)
            }
            const result = dispatcher.doDouble(state)
            result(listeners)
        }

        function onTake(state: CBResponse) {
            if (eventHandlers.onTake) {
                eventHandlers.onTake(state)
            }
            const result = dispatcher.doTake(state)
            result(listeners)
        }

        function onPass(state: CBResponse) {
            if (eventHandlers.onPass) {
                eventHandlers.onPass(state)
            }
            const result = dispatcher.doPass(state)
            result(listeners)
        }
    }
}
