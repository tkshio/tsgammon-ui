import { Dispatch, SetStateAction, useState } from 'react'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    decorate,
    setSGStateListener,
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'

export function useSingleGameListeners(
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
