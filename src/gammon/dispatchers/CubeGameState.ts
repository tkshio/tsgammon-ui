import {eog, EOGStatus ,Score, scoreAsRed, scoreAsWhite } from 'tsgammon-core'
import { CubeOwner, CubeState } from 'tsgammon-core/CubeState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { applyStakeConf, StakeConf } from './StakeConf'

export type CBState =
    | CBOpening
    | CBInPlay
    | CBAction
    | CBResponse
    | CBToRoll
    | CBEoG
export type CBOpening = CBGameState & {
    tag: 'CBOpening'

    doStartCheckerPlayRed: () => CBInPlayRed
    doStartCheckerPlayWhite: () => CBInPlayWhite
}

export type CBAction = CBActionRed | CBActionWhite
export type CBResponse = CBResponseRed | CBResponseWhite
export type CBToRoll = CBToRollRed | CBToRollWhite
export type CBInPlay = CBInPlayRed | CBInPlayWhite
export type CBEoG = CBEoGRedWon | CBEoGWhiteWon
export type CBGameState = {
    cubeState: CubeState
}

type _CBAction = CBGameState & {
    tag: 'CBAction'
}

export type CBActionRed = _CBAction & {
    isRed: true
    doDouble: () => CBResponseWhite
    doStartCheckerPlay: () => CBInPlayRed
    doSkipCubeAction: () => CBToRollRed
}

export type CBActionWhite = _CBAction & {
    isRed: false
    doDouble: () => CBResponseRed
    doStartCheckerPlay: () => CBInPlayWhite
    doSkipCubeAction: () => CBToRollWhite
}

type _CBResponse = CBGameState & {
    tag: 'CBResponse'
    isRed: boolean
}
export type CBResponseRed = _CBResponse & {
    doTake: () => CBToRollWhite
    doPass: () => CBEoGWhiteWon
    isDoubleFromRed: false
    isRed: true
}
export type CBResponseWhite = _CBResponse & {
    doTake: () => CBToRollRed
    doPass: () => CBEoGRedWon
    isDoubleFromRed: true
    isRed: false
}
type LastCubeAction = 'Take' | 'Skip'

type _CBToRoll = CBGameState & {
    tag: 'CBToRoll'
    lastAction: LastCubeAction
}
export type CBToRollRed = _CBToRoll & {
    isRed: true
    doStartCheckerPlay: () => CBInPlayRed
}
export type CBToRollWhite = _CBToRoll & {
    isRed: false
    doStartCheckerPlay: () => CBInPlayWhite
}

type _CBInPlay = CBGameState & {
    tag: 'CBInPlay'
    mayDouble: boolean
    lastAction: LastCubeAction
}
export type CBInPlayRed = _CBInPlay & {
    isRed: true
    doStartCubeAction: () => CBActionWhite | CBToRollWhite
}
export type CBInPlayWhite = _CBInPlay & {
    isRed: false
    doStartCubeAction: () => CBActionRed | CBToRollRed
}

type _CBEoG = CBGameState & {
    tag: 'CBEoG'

    eogStatus: EOGStatus
    isWonByPass: boolean
    calcStake: (conf?: StakeConf) => {
        stake: Score
        eogStatus: EOGStatus
        jacobyApplied: boolean
    }
}

export type CBEoGRedWon = _CBEoG & {
    result: SGResult.REDWON
}

export type CBEoGWhiteWon = _CBEoG & {
    result: SGResult.WHITEWON
}

export function cbOpening(cubeState: CubeState): CBOpening {
    return {
        tag: 'CBOpening',
        cubeState,
        doStartCheckerPlayRed: () => cbInPlayRed(cubeState, 'Skip'),
        doStartCheckerPlayWhite: () => cbInPlayWhite(cubeState, 'Skip'),
    }
}

export function cbActionRed(cubeState: CubeState): CBActionRed {
    return {
        tag: 'CBAction',
        isRed: true,
        cubeState,
        doDouble: () => {
            return cbResponseWhite(cubeState)
        },
        doStartCheckerPlay: () => {
            return cbInPlayRed(cubeState, 'Skip')
        },
        doSkipCubeAction: () => {
            return cbToRollRed(cubeState, 'Skip')
        },
    }
}
export function cbActionWhite(cubeState: CubeState): CBActionWhite {
    return {
        tag: 'CBAction',
        isRed: false,
        cubeState,
        doDouble: () => {
            return cbResponseRed(cubeState)
        },
        doStartCheckerPlay: () => {
            return cbInPlayWhite(cubeState, 'Skip')
        },
        doSkipCubeAction: () => {
            return cbToRollWhite(cubeState, 'Skip')
        },
    }
}
export function cbInPlayRed(
    cubeState: CubeState,
    lastAction: LastCubeAction
): CBInPlayRed {
    const mayDouble = cubeState.mayDoubleFor(CubeOwner.WHITE)
    return {
        tag: 'CBInPlay',
        isRed: true,
        cubeState,
        mayDouble,
        doStartCubeAction(): CBActionWhite | CBToRollWhite {
            return mayDouble
                ? cbActionWhite(cubeState)
                : cbToRollWhite(cubeState, 'Skip')
        },
        lastAction,
    }
}
export function cbInPlayWhite(
    cubeState: CubeState,
    lastAction: LastCubeAction
): CBInPlayWhite {
    const mayDouble = cubeState.mayDoubleFor(CubeOwner.RED)
    return {
        tag: 'CBInPlay',
        isRed: false,
        cubeState,
        mayDouble,
        doStartCubeAction(): CBActionRed | CBToRollRed {
            return mayDouble
                ? cbActionRed(cubeState)
                : cbToRollRed(cubeState, 'Skip')
        },
        lastAction,
    }
}
export function cbResponseRed(cubeState: CubeState): CBResponseRed {
    return {
        tag: 'CBResponse',
        isDoubleFromRed: false,
        isRed: true,
        cubeState,
        doTake: () => {
            return doAccept(CubeOwner.RED, cbToRollWhite, cubeState)
        },
        doPass: () => {
            return eogForPass(cbEoGWhite, cubeState)
        },
    }
}
export function cbResponseWhite(cubeState: CubeState): CBResponseWhite {
    return {
        tag: 'CBResponse',
        isDoubleFromRed: true,
        isRed: false,
        cubeState,
        doTake: () => {
            return doAccept(CubeOwner.WHITE, cbToRollRed, cubeState)
        },
        doPass: () => {
            return eogForPass(cbEoGRed, cubeState)
        },
    }
}

function eogForPass<T extends CBEoG>(
    cbEoG: (cubeState: CubeState, eog: EOGStatus, isWonByPass: boolean) => T,
    cubeState: CubeState
): T {
    return cbEoG(cubeState, eog(), true)
}

function doAccept<T extends CBToRoll>(
    side: CubeOwner,
    cbToRoll: (cubeState: CubeState, cubeAction: LastCubeAction) => T,
    cubeState: CubeState
): T {
    return cbToRoll(cubeState.double(side), 'Take')
}

export function cbToRollRed(
    cubeState: CubeState,
    lastAction: LastCubeAction
): CBToRollRed {
    return {
        tag: 'CBToRoll',
        isRed: true,
        cubeState,
        doStartCheckerPlay: () => {
            return cbInPlayRed(cubeState, lastAction)
        },
        lastAction,
    }
}
export function cbToRollWhite(
    cubeState: CubeState,
    lastAction: LastCubeAction
): CBToRollWhite {
    return {
        tag: 'CBToRoll',
        isRed: false,
        cubeState,
        doStartCheckerPlay: () => {
            return cbInPlayWhite(cubeState, lastAction)
        },
        lastAction,
    }
}

export function resultToCBEoG(
    cubeState: CubeState,
    sgResult: SGResult.WHITEWON | SGResult.REDWON,
    eogStatus: EOGStatus
): CBEoG {
    switch (sgResult) {
        case SGResult.WHITEWON:
            return cbEoGWhite(cubeState, eogStatus, false)
        case SGResult.REDWON:
            return cbEoGRed(cubeState, eogStatus, false)
    }
}

function cbEoGRed(
    cubeState: CubeState,
    eogStatus: EOGStatus,
    isWonByPass: boolean
): CBEoGRedWon {
    return {
        tag: 'CBEoG',
        cubeState,
        result: SGResult.REDWON,
        eogStatus,
        isWonByPass,
        calcStake: (stakeConf?: StakeConf) => {
            const applied = applyStakeConf(cubeState, eogStatus, stakeConf)
            return {
                ...applied,
                stake: scoreAsRed(applied.stake),
            }
        },
    }
}

function cbEoGWhite(
    cubeState: CubeState,
    eogStatus: EOGStatus,
    isWonByPass: boolean
): CBEoGWhiteWon {
    return {
        tag: 'CBEoG',
        cubeState,
        result: SGResult.WHITEWON,
        eogStatus,
        isWonByPass,
        calcStake: (stakeConf?: StakeConf) => {
            const applied = applyStakeConf(cubeState, eogStatus, stakeConf)
            return {
                ...applied,
                stake: scoreAsWhite(applied.stake),
            }
        },
    }
}
