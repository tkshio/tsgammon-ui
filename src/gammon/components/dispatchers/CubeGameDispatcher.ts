import { EOGStatus } from 'tsgammon-core/EOGStatus'
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
} from 'tsgammon-core/states/CubeGameState'
import { CubeGameListener } from './CubeGameListener'
import { concat0, concat1, concat2 } from './utils/concat'

/**
 * キューブの状態のみを管理するDispatcher
 */
export type CubeGameDispatcher = {
    doStartCubeGame: () => (
        listener: Partial<Pick<CubeGameListener, 'onCubeGameStarted'>>
    ) => void

    doDouble: (
        state: CBAction
    ) => (listeners: Partial<Pick<CubeGameListener, 'onDoubled'>>) => void

    doTake: (
        state: CBResponse
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onDoubleAccepted'>>
    ) => void

    doPass: (
        state: CBResponse
    ) => (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => void

    // ゲームの進行状況に対応して受動的に使用される操作
    doStartCubeAction: (
        state: CBInPlay,
        skipCubeAction: (cbState: CBInPlay) => boolean
    ) => (
        listeners: Partial<
            Pick<
                CubeGameListener,
                | 'onCubeActionStarted'
                | 'onCubeActionSkipped'
                | 'onAwaitCubeAction'
            >
        >
    ) => void

    doSkipCubeAction: (
        state: CBAction
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onCubeActionSkipped'>>
    ) => void

    doStartOpeningCheckerPlay: (
        state: CBOpening,
        isRed: boolean
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => void

    doStartCheckerPlay: (
        state: CBAction | CBToRoll
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => void

    doEndOfCubeGame: (
        state: CBState,
        result: SGResult,
        eogStatus: EOGStatus
    ) => (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => void
}

export function concatCBListeners(
    base: Partial<CubeGameListener>,
    ...listeners: Partial<CubeGameListener>[]
): Partial<CubeGameListener> {
    return listeners.reduce(
        (prev: Partial<CubeGameListener>, cur: Partial<CubeGameListener>) => {
            return {
                onCubeGameStarted: concat0(
                    prev?.onCubeGameStarted,
                    cur?.onCubeGameStarted
                ),
                onAwaitCubeAction: concat1(
                    prev?.onAwaitCubeAction,
                    cur?.onAwaitCubeAction
                ),
                onCubeActionStarted: concat1(
                    prev?.onCubeActionStarted,
                    cur?.onCubeActionStarted
                ),
                onAwaitCheckerPlay: concat1(
                    prev?.onAwaitCheckerPlay,
                    cur?.onAwaitCheckerPlay
                ),
                onDoubled: concat2(prev?.onDoubled, cur?.onDoubled),
                onDoubleAccepted: concat2(
                    prev?.onDoubleAccepted,
                    cur?.onDoubleAccepted
                ),
                onCubeActionSkipped: concat1(
                    prev?.onCubeActionSkipped,
                    cur?.onCubeActionSkipped
                ),
                onEndOfCubeGame: concat1(
                    prev?.onEndOfCubeGame,
                    cur?.onEndOfCubeGame
                ),
            }
        },
        base
    )
}

export function setCBStateListener(
    defaultState: CBState,
    setCBState: (cbState: CBState) => void
): CubeGameListener {
    return {
        onCubeGameStarted: () => setCBState(defaultState),
        onAwaitCubeAction: () => {
            //
        },
        onCubeActionStarted: setCBState,
        onAwaitCheckerPlay: setCBState,
        onDoubled: setCBState,
        onDoubleAccepted: setCBState,
        onPassed: () => {
            //
        },
        onCubeActionSkipped: setCBState,
        onEndOfCubeGame: setCBState,
    }
}

export const cubeGameDispatcher: CubeGameDispatcher = {
    doStartCubeGame,
    doDouble,
    doSkipCubeAction,
    doTake,
    doPass,
    doStartCubeAction,
    doStartOpeningCheckerPlay,
    doStartCheckerPlay,
    doEndOfCubeGame,
}

function doStartCubeGame() {
    return (
        listeners: Partial<Pick<CubeGameListener, 'onCubeGameStarted'>>
    ) => {
        listeners.onCubeGameStarted?.()
    }
}
function doDouble(state: CBAction) {
    const nextState: CBResponse = state.doDouble()
    return (listeners: Partial<Pick<CubeGameListener, 'onDoubled'>>) => {
        listeners.onDoubled?.(nextState, state)
    }
}

function doSkipCubeAction(state: CBAction) {
    const nextState = state.doSkipCubeAction()
    return (
        listeners: Partial<Pick<CubeGameListener, 'onCubeActionSkipped'>>
    ) => {
        listeners.onCubeActionSkipped?.(nextState)
    }
}

function doTake(state: CBResponse) {
    const nextState: CBToRoll = state.doTake()
    return (listeners: Partial<Pick<CubeGameListener, 'onDoubleAccepted'>>) => {
        listeners.onDoubleAccepted?.(nextState, state)
    }
}

function doPass(state: CBResponse) {
    const nextState: CBEoG = state.doPass()
    return (
        listeners: Partial<
            Pick<CubeGameListener, 'onEndOfCubeGame' | 'onPassed'>
        >
    ) => {
        listeners.onPassed?.(state, state.isDoubleFromRed)
        listeners.onEndOfCubeGame?.(nextState)
    }
}

function doStartCubeAction(
    state: CBInPlay,
    skipCubeAction: (cbState: CBInPlay) => boolean
) {
    const nextState: CBAction | CBToRoll = state.doStartCubeAction(
        skipCubeAction(state)
    )
    return (
        listeners: Partial<
            Pick<
                CubeGameListener,
                | 'onCubeActionStarted'
                | 'onCubeActionSkipped'
                | 'onAwaitCubeAction'
            >
        >
    ) => {
        listeners.onAwaitCubeAction?.(nextState)
        if (nextState.tag === 'CBAction') {
            listeners.onCubeActionStarted?.(nextState)
        } else {
            listeners.onCubeActionSkipped?.(nextState)
        }
    }
}

function doStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
    const nextState: CBInPlay = isRed
        ? state.doStartCheckerPlayRed()
        : state.doStartCheckerPlayWhite()
    return (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => {
        listeners.onAwaitCheckerPlay?.(nextState)
    }
}

function doStartCheckerPlay(state: CBAction | CBToRoll) {
    const nextState: CBInPlay = state.doStartCheckerPlay()
    return (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => {
        listeners.onAwaitCheckerPlay?.(nextState)
    }
}

function doEndOfCubeGame(
    state: CBState,
    sgResult: SGResult,
    eogStatus: EOGStatus
) {
    const nextState: CBEoG = resultToCBEoG(state.cubeState, sgResult, eogStatus)
    return (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => {
        listeners.onEndOfCubeGame?.(nextState)
    }
}
