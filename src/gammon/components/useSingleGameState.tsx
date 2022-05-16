import { Dispatch, SetStateAction, useState } from 'react'
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
import { GameEventHandlers, SingleGameEventHandlers } from './EventHandlers'

export function useSingleGameState(
    gameConf: GameConf,
    initialSGState: SGState,
    rollListener: RollListener,
    ...listeners: Partial<SingleGameListeners>[]
): {
    sgState: SGState
    singleGameEventHandlers: SingleGameEventHandlers
    gameEventHandlers: Pick<GameEventHandlers, 'onStartNextGame'>
    setSGState: (sgState?: SGState) => void
} {
    const [sgState, sgListeners, setSGState] = useSingleGameListeners(
        initialSGState,
        ...listeners
    )
    const singleGameEventHandlers: SingleGameEventHandlers = sgEH(
        rollListener,
        sgListeners
    )
    const defaultState = openingState(boardState(gameConf.initialPos))
    const gameEventHandlers = {
        onStartNextGame: () => {
            setSGState(defaultState)
        },
    }
    return {
        sgState,
        singleGameEventHandlers,
        gameEventHandlers,
        setSGState: (sgState: SGState = defaultState) => setSGState(sgState),
    }
}
function sgEH(
    rollListener: RollListener,
    sgListeners: SingleGameListeners
): SingleGameEventHandlers {
    const dispatcher: SingleGameDispatcher = singleGameDispatcher(sgListeners)
    return {
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

function useSingleGameListeners(
    initialState: SGState,
    listeners: Partial<SingleGameListeners> = {}
): [SGState, SingleGameListeners, Dispatch<SetStateAction<SGState>>] {
    const [state, setState] = useState(initialState)
    const _listeners: SingleGameListeners = decorate(
        setSGStateListener(setState),
        listeners
    )
    return [state, _listeners, setState]
}
