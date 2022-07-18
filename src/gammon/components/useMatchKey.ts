import { useState } from 'react'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { BGListeners } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'

export function useMatchKey(): {
    matchKeyAddOn: Partial<BGListeners>
    matchKey: number
} {
    const [matchKey, setMatchKey] = useState(0)
    return {
        matchKey,
        matchKeyAddOn: {
            onEndOfCubeGame: (_: BGState) => {
                setMatchKey((mid) => mid + 1)
            },
        },
    }
}
