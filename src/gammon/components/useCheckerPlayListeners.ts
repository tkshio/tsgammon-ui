import { Dispatch, SetStateAction, useState } from 'react'
import {
    CheckerPlayListeners,
    decorate,
    setCPStateListener,
} from './dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from './states/CheckerPlayState'

export function useCheckerPlayListener(
    initialState: CheckerPlayState | undefined = undefined,
    listeners: Partial<CheckerPlayListeners> = {}
): {
    cpState: CheckerPlayState | undefined
    cpListener: CheckerPlayListeners
    setCPState: Dispatch<SetStateAction<CheckerPlayState | undefined>>
    clearCPState: () => void
} {
    const [cpState, setCPState] = useState(initialState)
    const cpListener: CheckerPlayListeners = decorate(
        setCPStateListener(setCPState),
        listeners
    )
    const clearCPState = () => setCPState(undefined)
    return { cpState, cpListener, setCPState, clearCPState }
}
