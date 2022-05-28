import { useState } from 'react';
import { CubeGameEventHandlerAddOn } from 'tsgammon-core/dispatchers/CubeGameEventHandlers';
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState';


export function useMatchKey(): {
    matchKeyAddOn: CubeGameEventHandlerAddOn;
    matchKey: number;
} {
    const [matchKey, setMatchKey] = useState(0);
    return {
        matchKey,
        matchKeyAddOn: {
            listeners: {
                onEndOfCubeGame: (_: CBEoG) => {
                    setMatchKey((mid) => mid + 1);
                },
            },
            eventHandlers: {},
        },
    };
}
