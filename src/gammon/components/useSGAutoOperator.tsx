import { useCallback } from 'react';
import { BoardStateNode } from 'tsgammon-core/BoardStateNode';
import { CubeState } from 'tsgammon-core/CubeState';
import { SingleGameDispatcherWithRD } from 'tsgammon-core/dispatchers/RollDispatcher';
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState';
import { useDelayedTrigger } from './utils/useDelayedTrigger';
import { SGOperator } from './operators/SGOperator';

export function useSGAutoOperator(
    sgState: SGState,
    autoOperator: SGOperator | undefined,
    dispatcher: SingleGameDispatcherWithRD,
    cube?: CubeState
) {
    const doRoll = useCallback(() => {
        if (sgState.tag === 'SGToRoll') {
           if (autoOperator) {
                const operation = autoOperator[sgState.isRed ? 'operateRollRed' : 'operateRollWhite'];
                const doRoll = () => dispatcher.doRoll(sgState);
                return operation(doRoll);
            }
        } else if (sgState.tag === 'SGInPlay') {
            if (autoOperator) {
                const operation = autoOperator[sgState.isRed
                    ? 'operateCheckerPlayRed'
                    : 'operateCheckerPlayWhite'];
                const doCheckerPlay = (node: BoardStateNode) => dispatcher.doCommitCheckerPlay(sgState, node);

                return operation(doCheckerPlay, sgState.boardStateNode, cube);
            }
        }
        return false;
    }, [sgState, autoOperator, dispatcher, cube]);

    useDelayedTrigger(doRoll, 10);
}
