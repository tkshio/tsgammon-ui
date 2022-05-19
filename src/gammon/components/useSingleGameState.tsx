import { useState } from 'react'
import { boardState, DiceRoll, GameConf } from 'tsgammon-core'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate,
    setSGStateListener,
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    openingState,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { SingleGameEventHandlers } from './EventHandlers'

export function singleGameListeners(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    ...listeners: Partial<SingleGameListeners>[]
): SingleGameListeners {
    const defaultState = openingState(boardState(gameConf.initialPos))
    return decorate(setSGStateListener(defaultState, setSGState), ...listeners)
}

export function useSingleGameState(
    initialSGState: SGState
): {
    sgState: SGState
    setSGState: (sgState: SGState) => void
} {
    const [sgState, setSGState] = useState(initialSGState)
    return {
        sgState,
        setSGState
    }
}

export function singleGameEventHandlers(
    rollListener: RollListener,
    sgListeners: SingleGameListeners
): SingleGameEventHandlers {
    const dispatcher: SingleGameDispatcher = singleGameDispatcher(sgListeners)
    return {
        onStartGame: dispatcher.doStartGame,
        onCommit: dispatcher.doCommitCheckerPlay,
        onRoll: (sgState: SGToRoll) =>
            rollListener.onRollRequest((dices: DiceRoll) => {
                dispatcher.doRoll(sgState, dices)
            }),
        onRollOpening: (sgState: SGOpening) =>
            rollListener.onRollRequest((dices: DiceRoll) =>
                dispatcher.doOpeningRoll(sgState, dices)
            ),
    }
}
