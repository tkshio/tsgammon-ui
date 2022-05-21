import { BoardState, CubeState } from 'tsgammon-core';


export type CBOperator = {
    operateRedCubeAction: (
        cubeState: CubeState,
        node: BoardState,
        doDouble: () => void,
        doSkipCubeAction: () => void
    ) => boolean;
    operateRedCubeResponse: (
        cubeState: CubeState,
        node: BoardState,
        doTake: () => void,
        doPass: () => void
    ) => boolean;
    operateWhiteCubeAction: (
        cubeState: CubeState,
        node: BoardState,
        doDouble: () => void,
        doSkipCubeAction: () => void
    ) => boolean;
    operateWhiteCubeResponse: (
        cubeState: CubeState,
        node: BoardState,
        doTake: () => void,
        doPass: () => void
    ) => boolean;
};
