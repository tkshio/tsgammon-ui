import { useCallback } from 'react'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    asSGEventHandlers,
    BGEventHandlers,
} from './eventHandlers/BGEventHandlers'
import { CBOperator } from './operators/CBOperator'
import { SGOperator } from './operators/SGOperator'
import { useSGAutoOperator } from './useSGAutoOperator'
import { useDelayedTrigger } from './utils/useDelayedTrigger'

export function useCBAutoOperator(
    cbState: CBState,
    sgState: SGState,
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    handlers: Partial<BGEventHandlers>
) {
    const { cb, sg } = autoOperators
    useSGAutoOperator(
        sgState,
        cbState.tag === 'CBResponse' || cbState.tag === 'CBEoG'
            ? undefined
            : sg,
        asSGEventHandlers(cbState, handlers)
    )

    const doCubeActions = useCallback(() => {
        if (cb) {
            if (cbState.tag === 'CBAction' && sgState.tag === 'SGToRoll') {
                const cubeAction =
                    cb[
                        cbState.isRed
                            ? 'operateRedCubeAction'
                            : 'operateWhiteCubeAction'
                    ]
                return cubeAction(
                    // TODO: matchLength, score, isCrawfordを渡す
                    cbState.cubeState,
                    sgState.boardState,
                    () => {
                        if (handlers.onDouble) {
                            handlers.onDouble({ cbState, sgState })
                        }
                    },
                    () => {
                        if (handlers.onRoll) {
                            handlers.onRoll({ cbState, sgState })
                        }
                    }
                )
            } else if (
                cbState.tag === 'CBResponse' &&
                sgState.tag === 'SGToRoll'
            ) {
                const cubeResponse =
                    cb[
                        cbState.isRed
                            ? 'operateRedCubeResponse'
                            : 'operateWhiteCubeResponse'
                    ]
                return cubeResponse(
                    cbState.cubeState,
                    sgState.boardState.revert(),
                    () => {
                        if (handlers.onTake) {
                            handlers.onTake({ cbState, sgState })
                        }
                    },
                    () => {
                        if (handlers.onPass) {
                            handlers.onPass({ cbState, sgState })
                        }
                    }
                )
            }
        }
        return false
    }, [cb, cbState, sgState, handlers])
    useDelayedTrigger(doCubeActions, 10)
}
