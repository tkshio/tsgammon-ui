import { Dispatch, SetStateAction, useState } from 'react'
import { SGState } from '../dispatchers/SingleGameState'
import {
    decorate,
    setStateListener,
    SingleGameListeners,
} from '../dispatchers/SingleGameDispatcher'

export function useSingleGameListeners(
    initialState: SGState,
    listeners: Partial<SingleGameListeners> = {}
): [SGState, SingleGameListeners, Dispatch<SetStateAction<SGState>>] {
    const [state, setState] = useState(initialState)
    const _listeners: SingleGameListeners = decorate(
        setStateListener(setState),
        listeners
    )
    return [state, _listeners, setState]
}
