import { BoardStateNode } from 'tsgammon-core';
import { SingleGameEventHandler, SingleGameEventHandlerExtensible } from 'tsgammon-core/dispatchers/SingleGameEventHandler';
import {
    SGInPlay,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState';
import { SGOperator } from './operators/SGOperator';

export function operateWithSG(
    sg: SGOperator | undefined,
    handler: SingleGameEventHandlerExtensible
): SingleGameEventHandler {
    if (sg === undefined) {
        return handler;
    }
    const autoHandler = {
        ...handler.addListeners({
            onAwaitRoll: (nextState: SGToRoll) => {
                const operation = sg[nextState.isRed
                    ? 'operateRollRed'
                    : 'operateRollWhite'];
                return setTimeout(() => operation(() => {
                    autoHandler.onRoll(nextState);
                })
                );
            },
            onCheckerPlayStarted: async (nextState: SGInPlay) => {
                const operation = await sg[nextState.isRed
                    ? 'operateCheckerPlayRed'
                    : 'operateCheckerPlayWhite'];
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit(nextState.withNode(node));
                };
                return operation(doCheckerPlay, nextState.boardStateNode);
            },
            onOpeningCheckerPlayStarted: async (nextState: SGInPlay) => {
                const operation = await sg[nextState.isRed
                    ? 'operateCheckerPlayRed'
                    : 'operateCheckerPlayWhite'];
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit(nextState.withNode(node));
                };
                return operation(doCheckerPlay, nextState.boardStateNode);
            },
        }),
    };
    return autoHandler;
}
