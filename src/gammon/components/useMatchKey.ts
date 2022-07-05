import { useState } from 'react'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'

export function useMatchKey(): {
    matchKeyAddOn: Partial<CubeGameListeners>
    matchKey: number
} {
    const [matchKey, setMatchKey] = useState(0)
    return {
        matchKey,
        matchKeyAddOn: {
            onEndOfCubeGame: (_: CBEoG) => {
                setMatchKey((mid) => mid + 1)
            },
        },
    }
}
