import { useState } from 'react'
import {
    SGState
} from 'tsgammon-core/dispatchers/SingleGameState'


export function useSingleGameState(initialSGState: SGState): {
    sgState: SGState
    setSGState: (sgState: SGState) => void
} {
    const [sgState, setSGState] = useState(initialSGState)
    return {
        sgState,
        setSGState,
    }
}
