import {initialStateBuilder} from "../../models/GameState";
import {dicePip} from "../../models/Dices";
import {gameStatus} from "../../models/GameStatus";
import {cube} from "../../models/CubeState";

test('initCheckerPlay', () => {
    const pieces = [0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -1,
        0]

    const state = initialStateBuilder.buildCheckerPlayStatus(dicePip(3), dicePip(4), undefined, pieces)
    expect(state.absoluteBoard().points()).toEqual(pieces)
    expect(state.status).toBe(gameStatus.commitCheckerPlayWhite)
    const stateRed = initialStateBuilder.buildCheckerPlayStatus(
        dicePip(3), dicePip(4), undefined, pieces, undefined, false)

    expect(stateRed.absoluteBoard().points()).toEqual(pieces)
    expect(stateRed.status).toBe(gameStatus.checkerPlayRed)
})

test('cubeAction', () => {
    const pieces = [0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -1,
        0]

    const state = initialStateBuilder.buildCubeActionStatus(undefined, pieces, cube(4, undefined))
    expect(state.absoluteBoard().points()).toEqual(pieces)
    expect(state.status).toBe(gameStatus.cubeActionWhite)
    expect(state.cube?.value).toBe(4)

    const stateRed = initialStateBuilder.buildCubeActionStatus(undefined, pieces, cube(4, undefined), false)
    expect(stateRed.absoluteBoard().points()).toEqual(pieces)
    expect(stateRed.status).toBe(gameStatus.cubeActionRed)
    expect(stateRed.cube?.value).toBe(4)

})

test('cubeResponse', () => {
    const pieces = [0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -1,
        0]

    const state = initialStateBuilder.buildCubeResponseStatus(cube(8, undefined), undefined, pieces)
    expect(state.absoluteBoard().points()).toEqual(pieces)
    expect(state.status).toBe(gameStatus.cubeResponseWhite)
    expect(state.cube?.value).toBe(8)

    const stateRed = initialStateBuilder.buildCubeResponseStatus(cube(8, undefined), undefined, pieces, false)
    expect(stateRed.absoluteBoard().points()).toEqual(pieces)
    expect(stateRed.status).toBe(gameStatus.cubeResponseRed)
})

test('initEndOfGame', () => {
    const pieces = [0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -1,
        0]

    const state = initialStateBuilder.buildEndOfGameStatus(undefined, pieces)
    expect(state.absoluteBoard().points()).toEqual(pieces)
    expect(state.status).toBe(gameStatus.endOfGame)

    const stateRed = initialStateBuilder.buildEndOfGameStatus(
        undefined, pieces, undefined, undefined)

    expect(stateRed.absoluteBoard().points()).toEqual(pieces)
    expect(stateRed.status).toBe(gameStatus.endOfGame)
})

test('initOpening', () => {
    const pieces = [0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -1,
        0]

    const state = initialStateBuilder.buildOpeningStatus(undefined, pieces)
    expect(state.absoluteBoard().points()).toEqual(pieces)
    expect(state.status).toBe(gameStatus.rollOpening)
})
