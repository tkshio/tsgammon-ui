import { useCallback } from 'react'
import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { CubeState } from 'tsgammon-core/CubeState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { useDelayedTrigger } from './utils/useDelayedTrigger'
import { SGOperator } from './operators/SGOperator'
import { SingleGameEventHandlers } from './eventHandlers/SingleGameEventHandlers'

export function useSGAutoOperator(
    sgState: SGState,
    autoOperator: SGOperator | undefined,
    handlers: Partial<SingleGameEventHandlers>,
    cube?: CubeState
) {
    const doRoll = useCallback(() => {
        if (sgState.tag === 'SGToRoll') {
            if (autoOperator) {
                const operation =
                    autoOperator[
                        sgState.isRed ? 'operateRollRed' : 'operateRollWhite'
                    ]
                const doRoll = () => {
                    handlers.onRoll?.(sgState)
                }
                return operation(doRoll)
            }
        } else if (sgState.tag === 'SGInPlay') {
            if (autoOperator) {
                const operation =
                    autoOperator[
                        sgState.isRed
                            ? 'operateCheckerPlayRed'
                            : 'operateCheckerPlayWhite'
                    ]
                const doCheckerPlay = (node: BoardStateNode) => {
                        handlers.onCommit?.(sgState, node)
                }
                return operation(doCheckerPlay, sgState.boardStateNode, cube)
            }
        }
        return false
    }, [sgState, autoOperator, handlers, cube])

    useDelayedTrigger(doRoll, 10)
}
