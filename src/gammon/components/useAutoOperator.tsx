import { useCallback } from 'react';
import { CubeGameDispatcher } from 'tsgammon-core/dispatchers/CubeGameDispatcher';
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState';
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState';
import { useDelayedTrigger } from './utils/useDelayedTrigger';
import { CBOperator } from './operators/CBOperator';

export function useAutoOperator(cbState: CBState, sgState: SGState, autoOperator: CBOperator | undefined, dispatcher: CubeGameDispatcher) {
    const doCubeActions = useCallback(() => {
        if (autoOperator) {
            if (cbState.tag === 'CBAction' && sgState.tag === 'SGToRoll') {
                const cubeAction = autoOperator[cbState.isRed
                    ? 'operateRedCubeAction'
                    : 'operateWhiteCubeAction'];
                return cubeAction(
                    // TODO: matchLength, score, isCrawfordを渡す
                    cbState.cubeState,
                    sgState.boardState,
                    () => {
                        dispatcher.doDouble(cbState);
                    },
                    () => {
                        dispatcher.doSkipCubeAction(cbState);
                    }
                );
            } else if (cbState.tag === 'CBResponse' &&
                sgState.tag === 'SGToRoll') {
                const cubeResponse = autoOperator[cbState.isRed
                    ? 'operateRedCubeResponse'
                    : 'operateWhiteCubeResponse'];
                return cubeResponse(
                    cbState.cubeState,
                    sgState.boardState.revert(),
                    () => {
                        dispatcher.doTake(cbState);
                    },
                    () => {
                        dispatcher.doPass(cbState);
                    }
                );
            }
        }
        return false;
    }, [autoOperator, cbState, sgState, dispatcher]);
    useDelayedTrigger(doCubeActions, 10);
}
