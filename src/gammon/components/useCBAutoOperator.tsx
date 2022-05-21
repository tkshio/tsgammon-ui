import { useCallback } from 'react'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { useDelayedTrigger } from './utils/useDelayedTrigger'
import { CBOperator } from './operators/CBOperator'
import { CubeGameEventHandlers } from './eventHandlers/CubeGameEventHandlers'
import { SGOperator } from './operators/SGOperator'
import { useSGAutoOperator } from './useSGAutoOperator'
import { SingleGameEventHandlers } from './eventHandlers/SingleGameEventHandlers'

export function useCBAutoOperator(
    cbState: CBState,
    sgState: SGState,
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    handlers: CubeGameEventHandlers & SingleGameEventHandlers
) {
    const { cb, sg } = autoOperators
    useSGAutoOperator(
        sgState,
        cbState.tag === 'CBAction' ||
            cbState.tag === 'CBResponse' ||
            cbState.tag === 'CBEoG'
            ? undefined
            : sg,
        handlers
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
                        handlers.onDouble(cbState)
                    },
                    () => {
                        handlers.onSkipCubeAction(cbState)
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
                        handlers.onTake(cbState)
                    },
                    () => {
                        handlers.onPass(cbState)
                    }
                )
            }
        }
        return false
    }, [cb, cbState, sgState, handlers])
    useDelayedTrigger(doCubeActions, 10)
}
