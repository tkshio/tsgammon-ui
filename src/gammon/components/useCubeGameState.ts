import { useState } from 'react'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'

export function useCubeGameState(initialCBState: CBState) {
    const [cbState, setCBState] = useState(initialCBState)
    return {
        cbState,
        setCBState,
    }
}