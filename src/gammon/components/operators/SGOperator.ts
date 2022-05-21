import { BoardStateNode } from 'tsgammon-core/BoardStateNode';
import { CubeState } from 'tsgammon-core/CubeState';


export type SGOperator = {
    operateCheckerPlayRed: (
        doCommitCheckerPlay: (nextNode: BoardStateNode) => void,
        curBoardState: BoardStateNode,
        cubeState?: CubeState
    ) => boolean;
    operateCheckerPlayWhite: (
        doCommitCheckerPlay: (nextNode: BoardStateNode) => void,
        curBoardState: BoardStateNode,
        cubeState?: CubeState
    ) => boolean;
    operateRollRed: (doRoll: () => void) => boolean;
    operateRollWhite: (doRoll: () => void) => boolean;
};
