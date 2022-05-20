import { useState } from 'react'
import { cube, EOGStatus, GameConf, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    cubeGameDispatcher,
    CubeGameListeners,
    decorate,
    setCBStateListener,
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    cbOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CubefulGameConfs } from '../CubefulGameBoard'
import {
    CubeGameEventHandlers,
    SingleGameEventHandlers,
} from '../EventHandlers'
import { toState } from '../recordedGames/BGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { cubefulSGListener } from '../useCubeGameState'
import { useMatchStateForCubeGame } from '../useMatchStateForCubeGame'
import { useSingleGameState } from '../useSingleGameState'
import { cubelessEventHandlers } from './Cubeless'

export type MoneyGameProps = {
    gameConf: GameConf
    setup?: GameSetup
    cbConfs?: CubefulGameConfs
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        CheckerPlayListeners &
        BoardEventHandlers
>
export function MoneyGame(props: MoneyGameProps) {
    const {
        gameConf = { ...standardConf, jacobyRule: true },
        setup,
        ...listeners
    } = props
    const matchLength = 0
    const { sgState: initialSGState, cbState: initialCBState } = toState(setup)
    const { sgState, setSGState } = useSingleGameState(initialSGState)
    const { cbState, setCBState } = useCubeGameState(initialCBState)
    const { matchState, matchStateListener, matchStateEventHandler } =
        useMatchStateForCubeGame(matchLength, gameConf)

    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const { handlers } = cubefulGameEventHandlers(
        gameConf,
        false,
        cbState,
        setSGState,
        setCBState,
        rollListeners(),
        {eventHandlers:matchStateEventHandler, listeners:matchStateListener},
        {eventHandlers:{},listeners:props}
    )
    const cbProps: CubefulGameProps = {
        sgState,
        cbState,
        cpState,
        ...listeners,
        matchState,
        ...handlers,
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}

export function useCubeGameState(initialCBState: CBState) {
    const [cbState, setCBState] = useState(initialCBState)
    return {
        cbState,
        setCBState,
    }
}
export function cubefulGameEventHandlers(
    gameConf: GameConf,
    isCrawford: boolean,
    cbState: CBState,
    setSGState: (sgState: SGState) => void,
    setCBState: (cbState: CBState) => void,
    rollListener: RollListener = rollListeners(),
    ...addOns: CubeGameEventHandlerAddOn[]
): {
    handlers: CubeGameEventHandlers & SingleGameEventHandlers
} {

    const { handlers: cbEventHandlers } = cubefulEventHandlers(
        isCrawford,
        setCBState,
        ...addOns
    )

    // SGStateの管理に追加する
    const cubeGameAddOn = {
        eventHandlers: {},
        listeners: cubefulSGListener(cbState, cbEventHandlers),
    }

    const { handlers: sgHandlers } = cubelessEventHandlers(
        gameConf,
        setSGState,
        rollListener,
        cubeGameAddOn,
        ...addOns
    )

    return {
        handlers: {
            ...sgHandlers,
            ...cbEventHandlers,
        },
    }
}
function cubefulEventHandlers(
    isCrawford: boolean,
    setCBState: (cbState: CBState) => void,
    ...addOns: {
        eventHandlers: Partial<SingleGameEventHandlers & CubeGameEventHandlers>
        listeners: Partial<SingleGameListeners & CubeGameListeners>
    }[]
) {
    // キューブの状態管理の準備
    const cbListeners: CubeGameListeners = cubeGameListeners(setCBState)

    const builder: EventHandlerBuilder<
        CubeGameEventHandlers,
        CubeGameListeners
    > = cubeGameEventHandlers(isCrawford)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, decorateCubeGameEventHandlers, decorate)
    )

    return { handlers: finalBuilder.build(cbListeners) }
}
type EventHandlerAddOn<H, L> = {
    eventHandlers: Partial<H>
    listeners: Partial<L>
}
type CubeGameEventHandlerAddOn = EventHandlerAddOn<
    CubeGameEventHandlers & SingleGameEventHandlers,
    CubeGameListeners & SingleGameListeners
>
type EventHandlerBuilder<H, L> = (addOn: EventHandlerAddOn<H, L>) => H

function wrap<H, L>(
    base: EventHandlerBuilder<H, L>,
    decorateH: (h1: Partial<H>, h2: Partial<H>) => Partial<H>,
    decorateL: (h1: Partial<L>, h2: Partial<L>) => Partial<L>,
    addOn?: EventHandlerAddOn<H, L>
): WrappedBuilder<H, L> {
    const builder = addOn
        ? concatAddOns(base, addOn, decorateH, decorateL)
        : base
    return {
        builder,
        addOn: (newAddOn: EventHandlerAddOn<H, L>) =>
            wrap(builder, decorateH, decorateL, newAddOn),
        build: (setStateListener: L) =>
            builder({ eventHandlers: {}, listeners: setStateListener }),
    }
}

type WrappedBuilder<H, L> = {
    builder: EventHandlerBuilder<H, L>
    addOn: (n: EventHandlerAddOn<H, L>) => WrappedBuilder<H, L>
    build: (setStateListener: L) => H
}

function concatAddOns<H, L>(
    builder: EventHandlerBuilder<H, L>,
    h: EventHandlerAddOn<H, L>,
    decorateH: (h1: Partial<H>, h2: Partial<H>) => Partial<H>,
    decorateL: (h1: Partial<L>, h2: Partial<L>) => Partial<L>
): EventHandlerBuilder<H, L> {
    return (addOn: EventHandlerAddOn<H, L>) => {
        const { eventHandlers, listeners } = addOn
        return builder({
            eventHandlers: decorateH(h.eventHandlers, eventHandlers),
            listeners: decorateL(h.listeners, listeners),
        })
    }
}

function cubeGameEventHandlers(
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

function cubeGameListeners(setCBState: (cbState: CBState) => void) {
    return setCBStateListener(cbOpening(cube(1)), setCBState)
}

function decorateCubeGameEventHandlers(
    base: Partial<CubeGameEventHandlers>,
    ...handlers: Partial<CubeGameEventHandlers>[]
): Partial<CubeGameEventHandlers> {
    const filled: CubeGameEventHandlers = {} as CubeGameEventHandlers

    return handlers.reduce(
        (prev: CubeGameEventHandlers, cur: Partial<CubeGameEventHandlers>) => {
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

            const foo: CubeGameEventHandlers = {
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
            return foo
        },
        filled
    )
}
