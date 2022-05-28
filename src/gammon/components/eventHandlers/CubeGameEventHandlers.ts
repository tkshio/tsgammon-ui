import { EOGStatus } from 'tsgammon-core'
import {
    concatCBListeners,
    CubeGameDispatcher,
    CubeGameListeners,
    setCBStateListener
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll
} from 'tsgammon-core/dispatchers/CubeGameState'
import { concat0, concat1, concat2, concat3 } from 'tsgammon-core/dispatchers/utils/concat'
import { SGResult } from 'tsgammon-core/records/SGResult'
import {
    EventHandlerAddOn,
    EventHandlerBuilder,
    wrap
} from './EventHandlerBuilder'

export type CubeGameEventHandlers = {
    onStartCubeGame: () => void

    onTake: (cbState: CBResponse) => void
    onPass: (cbState: CBResponse) => void
    onDouble: (cbState: CBAction) => void

    onStartOpeningCheckerPlay: (cbState: CBOpening, isRed: boolean) => void
    onStartCheckerPlay: (cbState: CBToRoll | CBAction) => void
    onStartCubeAction: (cbState: CBInPlay) => void
    onSkipCubeAction: (cbState: CBAction) => void
    onEndOfCubeGame: (
        cbState: CBState,
        result: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus
    ) => void
}

export type CubeGameEventHandlerAddOn = EventHandlerAddOn<
    CubeGameEventHandlers,
    CubeGameListeners
>

export function buildCBEventHandlers(
    cbDispatcher: CubeGameDispatcher,
    defaultCBState: CBState,
    setCBState: (cbState: CBState) => void,
    ...addOns: {
        eventHandlers: Partial<CubeGameEventHandlers>
        listeners: Partial<CubeGameListeners>
    }[]
): { handlers: CubeGameEventHandlers } {
    const cbListeners: CubeGameListeners = setCBStateListener(
        defaultCBState,
        (state: CBState) => setCBState(state)
    )
    const builder = cbEventHandlersBuilder(cbDispatcher)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, concatCBEventHandlers, concatCBListeners)
    )

    return finalBuilder.build(cbListeners)
}

export function cbEventHandlersBuilder(
    dispatcher: CubeGameDispatcher
): EventHandlerBuilder<CubeGameEventHandlers, CubeGameListeners> {
    return builder

    function builder(addOn: CubeGameEventHandlerAddOn): {
        handlers: CubeGameEventHandlers
    } {
        const { eventHandlers, listeners } = addOn
        return {
            handlers: concatCBEventHandlers(eventHandlers, {
                onStartCubeGame,
                onDouble,
                onTake,
                onPass,
                onSkipCubeAction,
                onStartCubeAction,
                onStartOpeningCheckerPlay,
                onStartCheckerPlay,
                onEndOfCubeGame,
            }) as CubeGameEventHandlers,
        }

        function onStartCubeGame() {
            const result = dispatcher.doStartCubeGame()
            result(listeners)
        }
        function onDouble(state: CBAction) {
            const result = dispatcher.doDouble(state)
            result(listeners)
        }

        function onTake(state: CBResponse) {
            const result = dispatcher.doTake(state)
            result(listeners)
        }

        function onPass(state: CBResponse) {
            const result = dispatcher.doPass(state)
            result(listeners)
        }

        function onSkipCubeAction(state: CBAction) {
            const result = dispatcher.doSkipCubeAction(state)
            result(listeners)
        }

        function onStartCubeAction(state: CBInPlay): void {
            const result = dispatcher.doStartCubeAction(state)
            result(listeners)
        }

        function onStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
            const result = dispatcher.doStartOpeningCheckerPlay(state, isRed)
            result(listeners)
        }

        function onStartCheckerPlay(state: CBAction | CBToRoll) {
            const result = dispatcher.doStartCheckerPlay(state)
            result(listeners)
        }

        function onEndOfCubeGame(
            state: CBState,
            sgResult: SGResult.REDWON | SGResult.WHITEWON,
            eogStatus: EOGStatus
        ) {
            const result = dispatcher.doEndOfCubeGame(
                state,
                sgResult,
                eogStatus
            )
            result(listeners)
        }
    }
}

export function concatCBEventHandlers(
    base: Partial<CubeGameEventHandlers>,
    ...handlers: Partial<CubeGameEventHandlers>[]
): Partial<CubeGameEventHandlers> {
    return handlers.reduce(
        (
            prev: Partial<CubeGameEventHandlers>,
            cur: Partial<CubeGameEventHandlers>
        ): Partial<CubeGameEventHandlers> => {
            return {
                onStartCubeGame: concat0(
                    prev?.onStartCubeGame,
                    cur?.onStartCubeGame
                ),
                onDouble: concat1(prev?.onDouble, cur?.onDouble),
                onTake: concat1(prev?.onTake, cur?.onTake),
                onPass: concat1(prev?.onPass, cur?.onPass),
                onStartCubeAction: concat1(
                    prev?.onStartCubeAction,
                    cur?.onStartCubeAction
                ),
                onSkipCubeAction: concat1(
                    prev?.onSkipCubeAction,
                    cur?.onSkipCubeAction
                ),
                onStartCheckerPlay: concat1(
                    prev?.onStartCheckerPlay,
                    cur?.onStartCheckerPlay
                ),
                onStartOpeningCheckerPlay: concat2(
                    prev?.onStartOpeningCheckerPlay,
                    cur?.onStartOpeningCheckerPlay
                ),
                onEndOfCubeGame: concat3(
                    prev?.onEndOfCubeGame,
                    cur?.onEndOfCubeGame
                ),
            }
        },
        base
    )
}
