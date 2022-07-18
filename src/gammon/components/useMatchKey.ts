import { useState } from 'react'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'

export function useMatchKey(): {
    matchKeyAddOn: Partial<BGListener>
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
