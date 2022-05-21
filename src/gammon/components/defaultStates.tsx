import { boardState, cube, GameConf } from 'tsgammon-core';
import { cbOpening } from 'tsgammon-core/dispatchers/CubeGameState';
import { openingState } from 'tsgammon-core/dispatchers/SingleGameState';

export function defaultBGState(gameConf: GameConf) {
    return {
        cbState: cbOpening(cube(1)),
        sgState: defaultSGState(gameConf),
    };
}

export function defaultSGState(gameConf: GameConf) {
    return openingState(boardState(gameConf.initialPos))
}