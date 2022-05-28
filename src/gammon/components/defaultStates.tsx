import { boardState, cube, GameConf, standardConf } from 'tsgammon-core';
import { cbOpening } from 'tsgammon-core/dispatchers/CubeGameState';
import { openingState } from 'tsgammon-core/dispatchers/SingleGameState';

export function defaultBGState(gameConf: GameConf = standardConf) {
    return {
        cbState: cbOpening(cube(1)),
        sgState: defaultSGState(gameConf),
    };
}

export function defaultSGState(gameConf: GameConf = standardConf) {
    return openingState(boardState(gameConf.initialPos))
}