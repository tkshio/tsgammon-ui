import { Dispatch, SetStateAction, useState } from 'react'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import {
    CheckerPlayListeners,
    decorate,
    setCPStateListener,
} from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'

export function useCheckerPlayListener(
    initialState: CheckerPlayState | undefined = undefined,
    listeners: Partial<CheckerPlayListeners> = {}
): [
    CheckerPlayState | undefined,
    CheckerPlayListeners,
    Dispatch<SetStateAction<CheckerPlayState | undefined>>
] {
    const [state, setState] = useState(initialState)
    const _listeners: CheckerPlayListeners = decorate(
        setCPStateListener(setState),
        listeners
    )
    return [state, _listeners, setState]
}
