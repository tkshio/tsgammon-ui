import { Dispatch, SetStateAction, useState } from 'react'
import { CBState } from '../dispatchers/CubeGameState'
import {
    CubeGameListeners,
    decorate,
    setCBStateListener,
} from '../dispatchers/CubeGameDispatcher'

export function useCubeGameListeners(
    initialState: CBState,
    listeners: Partial<CubeGameListeners> = {}
): [CBState, CubeGameListeners, Dispatch<SetStateAction<CBState>>] {
    const [state, setState] = useState(initialState)
    const _listeners: CubeGameListeners = decorate(
        setCBStateListener(setState),
        listeners
    )
    return [state, _listeners, setState]
}
