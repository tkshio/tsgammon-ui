import { useState } from 'react'
import { BGState } from 'tsgammon-core/dispatchers/BGState'

export function useBGState(initialBGState: BGState): {
    bgState: BGState
    setBGState: (bgState: BGState) => void
} {
    const [bgState, setBGState] = useState(initialBGState)
    return {
        bgState,
        setBGState,
    }
}
