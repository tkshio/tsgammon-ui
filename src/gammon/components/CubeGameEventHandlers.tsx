import { EOGStatus } from 'tsgammon-core';
import { CubeGameListeners, cubeGameDispatcher } from 'tsgammon-core/dispatchers/CubeGameDispatcher';
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll
} from 'tsgammon-core/dispatchers/CubeGameState';
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher';
import { SGResult } from 'tsgammon-core/records/SGResult';
import { EventHandlerAddOn, EventHandlerBuilder } from './EventHandlerBuilder';
import { SingleGameEventHandlers } from './SingleGameEventHandlers';


export type CubeGameEventHandlers = {
    onStartCubeGame: () => void;

    onTake: (cbState: CBResponse) => void;
    onPass: (cbState: CBResponse) => void;
    onDouble: (cbState: CBAction) => void;

    onStartOpeningCheckerPlay: (cbState: CBOpening, isRed: boolean) => void;
    onStartCheckerPlay: (cbState: CBToRoll | CBAction) => void;
    onStartCubeAction: (cbState: CBInPlay) => void;
    onSkipCubeAction: (cbState: CBAction) => void;
    onEndOfCubeGame: (
        cbState: CBState,
        result: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus
    ) => void;
};


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
        onStartCubeAction: doNothing,
        onSkipCubeAction: doNothing,
        onStartCheckerPlay: doNothing,
        onStartOpeningCheckerPlay: doNothing,
        onEndOfCubeGame: doNothing,
        ...base,
    }

    return handlers.reduce(
        (
            prev: CubeGameEventHandlers,
            cur: Partial<CubeGameEventHandlers>
        ): CubeGameEventHandlers => {
            const {
                onStartCubeGame,
                onDouble,
                onTake,
                onPass,
                onStartCubeAction,
                onSkipCubeAction,
                onStartCheckerPlay,
                onStartOpeningCheckerPlay,
                onEndOfCubeGame,
            } = cur

            return {
                onStartCubeGame: onStartCubeGame
                    ? () => {
                          prev.onStartCubeGame()
                          onStartCubeGame()
                      }
                    : prev.onStartCubeGame,
                onStartCubeAction: onStartCubeAction
                    ? (state: CBInPlay) => {
                          prev.onStartCubeAction(state)
                          onStartCubeAction(state)
                      }
                    : prev.onStartCubeAction,
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
                onSkipCubeAction: onSkipCubeAction
                    ? (state: CBAction) => {
                          prev.onSkipCubeAction(state)
                          onSkipCubeAction(state)
                      }
                    : prev.onSkipCubeAction,
                onStartCheckerPlay: onStartCheckerPlay
                    ? (state: CBAction | CBToRoll) => {
                          prev.onStartCheckerPlay(state)
                          onStartCheckerPlay(state)
                      }
                    : prev.onStartCheckerPlay,
                onStartOpeningCheckerPlay: onStartOpeningCheckerPlay
                    ? (state: CBOpening, isRed: boolean) => {
                          prev.onStartOpeningCheckerPlay(state, isRed)
                          onStartOpeningCheckerPlay(state, isRed)
                      }
                    : prev.onStartOpeningCheckerPlay,

                onEndOfCubeGame: onEndOfCubeGame
                    ? (
                          state: CBState,
                          result: SGResult.REDWON | SGResult.WHITEWON,
                          eogStatus: EOGStatus
                      ) => {
                          prev.onEndOfCubeGame(state, result, eogStatus)
                          onEndOfCubeGame(state, result, eogStatus)
                      }
                    : prev.onEndOfCubeGame,
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
    isCrawford: boolean
): EventHandlerBuilder<CubeGameEventHandlers, CubeGameListeners> {
    const dispatcher = cubeGameDispatcher(isCrawford)

    return (addOn: CubeGameEventHandlerAddOn): CubeGameEventHandlers => {
        const { eventHandlers, listeners } = addOn
        return {
            onStartCubeGame,
            onDouble,
            onSkipCubeAction,
            onTake,
            onPass,
            onStartCubeAction,
            onStartOpeningCheckerPlay,
            onStartCheckerPlay,
            onEndOfCubeGame,
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

        function onSkipCubeAction(state: CBAction) {
            if (eventHandlers.onSkipCubeAction) {
                eventHandlers.onSkipCubeAction(state)
            }
            const result = dispatcher.doSkipCubeAction(state)
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

        function onStartCubeAction(state: CBInPlay): void {
            if (eventHandlers.onStartCubeAction) {
                eventHandlers.onStartCubeAction(state)
            }
            const result = dispatcher.doStartCubeAction(state)
            result(listeners)
        }

        function onStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
            if (eventHandlers.onStartOpeningCheckerPlay) {
                eventHandlers.onStartOpeningCheckerPlay(state, isRed)
            }
            const result = dispatcher.doStartOpeningCheckerPlay(state, isRed)
            result(listeners)
        }

        function onStartCheckerPlay(state: CBAction | CBToRoll) {
            if (eventHandlers.onStartCheckerPlay) {
                eventHandlers.onStartCheckerPlay(state)
            }
            const result = dispatcher.doStartCheckerPlay(state)
            result(listeners)
        }

        function onEndOfCubeGame(
            state: CBState,
            sgResult: SGResult.REDWON | SGResult.WHITEWON,
            eogStatus: EOGStatus
        ) {
            if (eventHandlers.onEndOfCubeGame) {
                eventHandlers.onEndOfCubeGame(state, sgResult, eogStatus)
            }
            const result = dispatcher.doEndOfCubeGame(
                state,
                sgResult,
                eogStatus
            )
            result(listeners)
        }
    }
}
