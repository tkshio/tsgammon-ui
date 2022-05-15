import { Dispatch, SetStateAction, useState } from 'react'
import { boardState, DiceRoll, GameConf } from 'tsgammon-core'
import {
    rollDispatcher,
    RollListener,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate,
    decorate as decorateSG,
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
} {
    const [sgState, sgListeners, setSGState] = useSingleGameListeners(
        initialSGState,
        ...listeners
    )
    function sgEH(
        ...listeners: Partial<SingleGameListeners>[]
    ): SingleGameEventHandlers {
        const dispatcher: SingleGameDispatcher = singleGameDispatcher(
            decorateSG({}, ...listeners)
        )
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
            onSetSGState: (
                sgState: SGState = openingState(boardState(gameConf.initialPos))
            ) => {
                setSGState(sgState)
            },
        }
    }
    const singleGameEventHandlers: SingleGameEventHandlers = sgEH(sgListeners)
    const gameEventHandlers = {
        onStartNextGame: () => {
            singleGameEventHandlers.onSetSGState()
        },
    }
    return { sgState, singleGameEventHandlers, gameEventHandlers }
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
