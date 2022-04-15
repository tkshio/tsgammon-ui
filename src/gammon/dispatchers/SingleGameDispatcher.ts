import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { DiceRoll } from 'tsgammon-core/Dices'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'

export type SingleGameDispatcher = {
    doOpeningRoll: (state: SGOpening, dices: DiceRoll) => void
    doCommitCheckerPlay: (
        state: SGInPlay,
        curBoardState: BoardStateNode
    ) => SGToRoll | SGEoG
    doRoll: (state: SGToRoll, dices: DiceRoll) => void
}

export type SingleGameListeners = {
    onStartOpeningCheckerPlay: (nextState: SGInPlay) => void
    onStartCheckerPlay: (nextState: SGInPlay) => void
    onRerollOpening: (nextState: SGOpening) => void
    onAwaitRoll: (nextState: SGToRoll) => void
    onEndOfGame: (nextState: SGEoG) => void
}

export function singleGameDispatcher(
    listeners: Partial<SingleGameListeners>
): SingleGameDispatcher {
    const dispatcher = {
        doOpeningRoll: (state: SGOpening, dices: DiceRoll) => {
            const nextState = state.doOpening(dices)
            if (nextState.tag === 'SGInPlay') {
                if (listeners.onStartOpeningCheckerPlay) {
                    listeners.onStartOpeningCheckerPlay(nextState)
                }
            } else {
                if (listeners.onRerollOpening) {
                    listeners.onRerollOpening(nextState)
                }
            }
        },
        doCommitCheckerPlay: (
            state: SGInPlay,
            curBoardState: BoardStateNode
        ) => {
            const revertTo = state.revertTo
            const nextState = state.doCheckerPlayCommit(curBoardState, revertTo)
            if (nextState.tag === 'SGEoG') {
                if (listeners.onEndOfGame) {
                    listeners.onEndOfGame(nextState)
                }
            } else {
                if (listeners.onAwaitRoll) {
                    listeners.onAwaitRoll(nextState)
                }
            }
            return nextState
        },
        doRoll: (state: SGToRoll, dices: DiceRoll) => {
            const nextState = state.doRoll(dices)
            if (listeners.onStartCheckerPlay) {
                listeners.onStartCheckerPlay(nextState)
            }
        },
    }
    return dispatcher
}

export function fill(
    listeners: Partial<SingleGameListeners>
): SingleGameListeners {
    const doNothing: SingleGameListeners = {
        onStartOpeningCheckerPlay: () => {
            //
        },
        onStartCheckerPlay: () => {
            //
        },
        onRerollOpening: () => {
            //
        },
        onAwaitRoll: () => {
            //
        },
        onEndOfGame: () => {
            //
        },
    }
    return {
        ...doNothing,
        ...listeners,
    }
}

export function decorate(
    base: Partial<SingleGameListeners>,
    ...listners: Partial<SingleGameListeners>[]
): SingleGameListeners {
    return listners.reduce(
        (prev: SingleGameListeners, cur: Partial<SingleGameListeners>) => {
            const {
                onStartOpeningCheckerPlay,
                onStartCheckerPlay,
                onRerollOpening,
                onAwaitRoll,
                onEndOfGame,
            } = cur
            return {
                onStartOpeningCheckerPlay: onStartOpeningCheckerPlay
                    ? (nextState: SGInPlay) => {
                          prev.onStartOpeningCheckerPlay(nextState)
                          onStartOpeningCheckerPlay(nextState)
                      }
                    : prev.onStartOpeningCheckerPlay,
                onStartCheckerPlay: onStartCheckerPlay
                    ? (nextState: SGInPlay) => {
                          prev.onStartCheckerPlay(nextState)
                          onStartCheckerPlay(nextState)
                      }
                    : prev.onStartOpeningCheckerPlay,
                onRerollOpening: onRerollOpening
                    ? (nextState: SGOpening) => {
                          prev.onRerollOpening(nextState)
                          onRerollOpening(nextState)
                      }
                    : prev.onRerollOpening,
                onAwaitRoll: onAwaitRoll
                    ? (nextState: SGToRoll) => {
                          prev.onAwaitRoll(nextState)
                          onAwaitRoll(nextState)
                      }
                    : prev.onAwaitRoll,
                onEndOfGame: onEndOfGame
                    ? (nextState: SGEoG) => {
                          prev.onEndOfGame(nextState)
                          onEndOfGame(nextState)
                      }
                    : prev.onEndOfGame,
            }
        },
        fill(base)
    )
}

export function setSGStateListener(
    setState: (state: SGState) => void
): SingleGameListeners {
    return {
        onStartOpeningCheckerPlay: setState,
        onStartCheckerPlay: setState,
        onRerollOpening: setState,
        onAwaitRoll: setState,
        onEndOfGame: setState,
    }
}
