import { DiceRoll } from 'tsgammon-core/Dices'
import { SGOpening, SGToRoll } from 'tsgammon-core/states/SingleGameState'
import { RollListener, rollListener } from './RollDispatcher'
import { singleGameDispatcher } from './SingleGameDispatcher'
import {
    SingleGameEventHandler,
    SingleGameEventHandlerExtensible,
} from './SingleGameEventHandler'
import { SingleGameListener } from './SingleGameListener'
import { concat0, concat1 } from './utils/concat'

/**
 * チェッカープレイを管理する、SingleGameEventHandler
 * (SingleGameEventHandlerExtensible)オブジェクトを生成する
 * @param rListener
 * @param listeners
 * @returns
 */
export function buildSGEventHandler(
    rListener: RollListener = rollListener(),
    ...listeners: Partial<SingleGameListener>[]
): SingleGameEventHandlerExtensible {
    return buildSGEventHandler_rec(rListener, {}, ...listeners)
}

function buildSGEventHandler_rec(
    rollListener: RollListener,
    sgListener: Partial<SingleGameListener>,
    ...listeners: Partial<SingleGameListener>[]
): SingleGameEventHandlerExtensible {
    const listener: SingleGameListener = {
        ...emptySGListener,
        ...listeners.reduce(
            (prev, cur) => concatSGListeners(prev, cur),
            sgListener
        ),
    }
    const addListeners = (...toAdd: Partial<SingleGameListener>[]) => {
        return buildSGEventHandler_rec(rollListener, listener, ...toAdd)
    }
    return {
        ..._buildSGEventHandler(rollListener, listener),
        addListeners,
    }
}

function _buildSGEventHandler(
    rollListener: RollListener,
    listeners: SingleGameListener
): SingleGameEventHandler {
    return {
        onStartGame: () => {
            const result = singleGameDispatcher.doStartGame()
            result(listeners)
        },
        onCommit: (state) => {
            const result = singleGameDispatcher.doCommitCheckerPlay(state)
            result(listeners)
        },
        onRoll: (sgState: SGToRoll) =>
            rollListener.onRollRequest((dices: DiceRoll) => {
                const result = singleGameDispatcher.doRoll(sgState, dices)
                result(listeners)
            }),
        onRollOpening: (sgState: SGOpening) =>
            rollListener.onRollRequest((dices: DiceRoll) => {
                const result = singleGameDispatcher.doOpeningRoll(
                    sgState,
                    dices
                )
                result(listeners)
            }),
    }
}
const emptySGListener: SingleGameListener = {
    onAwaitRoll: () => {
        //
    },
    onCheckerPlayCommitted: () => {
        //
    },
    onCheckerPlayStarted: () => {
        //
    },
    onEndOfGame: () => {
        //
    },
    onGameStarted: () => {
        //
    },
    onOpeningCheckerPlayStarted: () => {
        //
    },
    onRerollOpening: () => {
        //
    },
}

export function concatSGListeners(
    base: Partial<SingleGameListener>,
    ...listners: Partial<SingleGameListener>[]
): Partial<SingleGameListener> {
    return listners.reduce(
        (
            prev: Partial<SingleGameListener>,
            cur: Partial<SingleGameListener>
        ) => {
            return {
                onGameStarted: concat0(prev?.onGameStarted, cur?.onGameStarted),
                onOpeningCheckerPlayStarted: concat1(
                    prev?.onOpeningCheckerPlayStarted,
                    cur?.onOpeningCheckerPlayStarted
                ),
                onCheckerPlayStarted: concat1(
                    prev?.onCheckerPlayStarted,
                    cur?.onCheckerPlayStarted
                ),
                onCheckerPlayCommitted: concat1(
                    prev.onCheckerPlayCommitted,
                    cur.onCheckerPlayCommitted
                ),
                onRerollOpening: concat1(
                    prev?.onRerollOpening,
                    cur?.onRerollOpening
                ),
                onAwaitRoll: concat1(prev?.onAwaitRoll, cur?.onAwaitRoll),
                onEndOfGame: concat1(prev?.onEndOfGame, cur?.onEndOfGame),
            }
        },
        base
    )
}
