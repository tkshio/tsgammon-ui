import { BoardStateNode } from 'tsgammon-core';
import { SingleGameEventHandler, SingleGameEventHandlerExtensible } from 'tsgammon-core/dispatchers/SingleGameEventHandler';
import {
    SGInPlay,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState';
import { SGOperator } from '../operators/SGOperator';

export function operateWithSG(
    sg: SGOperator | undefined,
    handlers: SingleGameEventHandlerExtensible
): SingleGameEventHandler {
    if (sg === undefined) {
        return handlers;
    }
    const autoHandler = {
        ...handlers.addListeners({
            onAwaitRoll: (nextState: SGToRoll, _: SGInPlay) => {
                const operation = sg[nextState.isRed
                    ? 'operateRollRed'
                    : 'operateRollWhite'];
                return setTimeout(() => operation(() => {
                    autoHandler.onRoll(nextState);
                })
                );
            },
            onStartCheckerPlay: async (nextState: SGInPlay) => {
                const operation = await sg[nextState.isRed
                    ? 'operateCheckerPlayRed'
                    : 'operateCheckerPlayWhite'];
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit(nextState.withNode(node));
                };
                return operation(doCheckerPlay, nextState.boardStateNode);
            },
            onStartOpeningCheckerPlay: async (nextState: SGInPlay) => {
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
