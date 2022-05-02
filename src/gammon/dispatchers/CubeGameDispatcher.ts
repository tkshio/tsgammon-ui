import { EOGStatus } from 'tsgammon-core'
import { SGResult } from 'tsgammon-core/records/SGResult'
import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
    resultToCBEoG,
} from './CubeGameState'

export type CubeGameDispatcher = {
    // キューブアクション固有のU.I.から能動的に使用する操作
    doDouble: (state: CBAction) => void
    doSkipCubeAction: (state: CBAction) => void
    doTake: (state: CBResponse) => void
    doPass: (state: CBResponse) => void

    // ゲームの進行状況に対応して受動的に使用される操作
    doStartCubeAction: (state: CBInPlay, skipCubeAction:boolean) => void
    doStartOpeningCheckerPlay: (state: CBOpening, isRed: boolean) => void
    doStartCheckerPlay: (state: CBAction | CBToRoll) => void
    doEndOfCubeGame: (
        state: CBState,
        result: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus,
    ) => void
}

export type CubeGameListeners = {
    onStartCubeAction: (nextState: CBAction) => void
    onAwaitCheckerPlay: (nextState: CBInPlay) => void
    onSkipCubeAction: (nextState: CBToRoll) => void

    onDouble: (nextState: CBResponse) => void
    onTake: (nextState: CBToRoll) => void
    onEndOfCubeGame: (nextState: CBEoG) => void
}

export function fill(listeners: Partial<CubeGameListeners>): CubeGameListeners {
    const doNothing: CubeGameListeners = {
        onStartCubeAction: () => {
            //
        },
        onAwaitCheckerPlay: () => {
            //
        },
        onDouble: () => {
            //
        },
        onTake: () => {
            //
        },
        onSkipCubeAction: () => {
            //
        },
        onEndOfCubeGame: () => {
            //
        },
    }
    return { ...doNothing, ...listeners }
}

export function decorate(
    base: Partial<CubeGameListeners>,
    ...listeners: Partial<CubeGameListeners>[]
): CubeGameListeners {
    return listeners.reduce(
        (prev: CubeGameListeners, cur: Partial<CubeGameListeners>) => {
            const {
                onStartCubeAction,
                onAwaitCheckerPlay,
                onDouble,
                onTake: onAccept,
                onSkipCubeAction,
                onEndOfCubeGame,
            } = cur
            return {
                onStartCubeAction: onStartCubeAction
                    ? (nextState: CBAction) => {
                          prev.onStartCubeAction(nextState)
                          onStartCubeAction(nextState)
                      }
                    : prev.onStartCubeAction,
                onAwaitCheckerPlay: onAwaitCheckerPlay
                    ? (nextState: CBInPlay) => {
                          prev.onAwaitCheckerPlay(nextState)
                          onAwaitCheckerPlay(nextState)
                      }
                    : prev.onAwaitCheckerPlay,
                onDouble: onDouble
                    ? (nextState: CBResponse) => {
                          prev.onDouble(nextState)
                          onDouble(nextState)
                      }
                    : prev.onDouble,
                onTake: onAccept
                    ? (nextState: CBToRoll) => {
                          prev.onTake(nextState)
                          onAccept(nextState)
                      }
                    : prev.onTake,
                onSkipCubeAction: onSkipCubeAction
                    ? (nextState: CBToRoll) => {
                          prev.onSkipCubeAction(nextState)
                          onSkipCubeAction(nextState)
                      }
                    : prev.onSkipCubeAction,
                onEndOfCubeGame: onEndOfCubeGame
                    ? (nextState: CBEoG) => {
                          prev.onEndOfCubeGame(nextState)
                          onEndOfCubeGame(nextState)
                      }
                    : prev.onEndOfCubeGame,
            }
        },
        fill(base)
    )
}

export function setCBStateListener(
    setCBState: (cbState: CBState) => void
): CubeGameListeners {
    return {
        onStartCubeAction: setCBState,
        onAwaitCheckerPlay: setCBState,
        onDouble: setCBState,
        onTake: setCBState,
        onSkipCubeAction: setCBState,
        onEndOfCubeGame: setCBState,
    }
}

export function cubeGameDispatcher(
    listeners: Partial<CubeGameListeners>): CubeGameDispatcher {
    return {
        doDouble,
        doSkipCubeAction,
        doTake,
        doPass,
        doStartCubeAction,
        doStartOpeningCheckerPlay,
        doStartCheckerPlay,
        doEndOfCubeGame,
    }

    function doDouble(state: CBAction) {
        if (listeners.onDouble) {
            const nextState: CBResponse = state.doDouble()
            listeners.onDouble(nextState)
        }
    }

    function doSkipCubeAction(state: CBAction) {
        if (listeners.onSkipCubeAction) {
            const nextState = state.doSkipCubeAction()
            listeners.onSkipCubeAction(nextState)
        }
    }

    function doTake(state: CBResponse) {
        if (listeners.onTake) {
            const nextState: CBToRoll = state.doTake()
            listeners.onTake(nextState)
        }
    }

    function doPass(state: CBResponse) {
        if (listeners.onEndOfCubeGame) {
            const nextState: CBEoG = state.doPass()
            listeners.onEndOfCubeGame(nextState)
        }
    }

    function doStartCubeAction(state: CBInPlay, skipCubeAction:boolean): void {
        const nextState: CBAction | CBToRoll = state.doStartCubeAction(skipCubeAction)
        if (nextState.tag === 'CBAction') {
            if (listeners.onStartCubeAction) {
                listeners.onStartCubeAction(nextState)
            }
        } else {
            if (listeners.onSkipCubeAction) {
                listeners.onSkipCubeAction(nextState)
            }
        }
    }

    function doStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
        if (listeners.onAwaitCheckerPlay) {
            const nextState: CBInPlay = isRed
                ? state.doStartCheckerPlayRed()
                : state.doStartCheckerPlayWhite()
            listeners.onAwaitCheckerPlay(nextState)
        }
    }

    function doStartCheckerPlay(state: CBAction | CBToRoll) {
        if (listeners.onAwaitCheckerPlay) {
            const nextState: CBInPlay = state.doStartCheckerPlay()
            listeners.onAwaitCheckerPlay(nextState)
        }
    }

    function doEndOfCubeGame(
        state: CBState,
        sgResult: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus,
    ) {
        if (listeners.onEndOfCubeGame) {
            const nextState: CBEoG = resultToCBEoG(
                state.cubeState,
                sgResult,
                eogStatus
            )
            listeners.onEndOfCubeGame(nextState)
        }
    }
}
