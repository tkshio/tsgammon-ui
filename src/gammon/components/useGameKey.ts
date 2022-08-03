import { useState } from 'react'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'

export function useGameKey(): {
    gameKeyAddOn: Partial<BGListener>
    gameKey: number
} {
    const [gameKey, setGameKey] = useState(0)
    return {
        gameKey,
        gameKeyAddOn: {
            onEndOfBGGame: (_: BGState) => {
                setGameKey((mid) => mid + 1)
            },
        },
    }
}
