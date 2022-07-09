import { BoardStateNode } from 'tsgammon-core';
import { SingleGameEventHandlers, SingleGameEventHandlersExtensible } from 'tsgammon-core/dispatchers/SingleGameEventHandlers';
import {
    SGInPlay,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState';
import { SGOperator } from '../operators/SGOperator';

export function operateWithSG(
    sg: SGOperator | undefined,
    handlers: SingleGameEventHandlersExtensible
): SingleGameEventHandlers {
    if (sg === undefined) {
        return handlers;
    }
    const autoHandler = {
        ...handlers.addListeners({
            onAwaitRoll: (nextState: SGToRoll, _: SGInPlay) => {
                console.log('await roll');
                const operation = sg[nextState.isRed
                    ? 'operateRollRed'
                    : 'operateRollWhite'];
                return setTimeout(() => operation(() => {
                    console.log('do Roll');
                    autoHandler.onRoll?.(nextState);
                })
                );
            },
            onStartCheckerPlay: async (nextState: SGInPlay) => {
                console.log('start checkerPlay');
                const operation = await sg[nextState.isRed
                    ? 'operateCheckerPlayRed'
                    : 'operateCheckerPlayWhite'];
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit?.(nextState.withNode(node));
                };
                return operation(doCheckerPlay, nextState.boardStateNode);
            },
            onStartOpeningCheckerPlay: async (nextState: SGInPlay) => {
                console.log('start Opening checkerPlay');
                const operation = await sg[nextState.isRed
                    ? 'operateCheckerPlayRed'
                    : 'operateCheckerPlayWhite'];
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit?.(nextState.withNode(node));
                };
                return operation(doCheckerPlay, nextState.boardStateNode);
            },
        }),
    };
    return autoHandler;
}
