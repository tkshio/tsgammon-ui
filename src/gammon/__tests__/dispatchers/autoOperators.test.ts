import { boardState, boardStateNode, cube } from 'tsgammon-core'
import {
    GammonEngine,
    simpleEvalEngine,
} from 'tsgammon-core/engines/GammonEngine'
import { CBOperator } from "../../components/operators/CBOperator"
import { SGOperator } from "../../components/operators/SGOperator"
import {
    bothCBAutoOperator,
    bothSGAutoOperator,
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../../components/operators/autoOperators'

const rollRed = jest.fn(() => {
    //
})
const rollWhite = jest.fn(() => {
    //
})
const playRed = jest.fn()
const playWhite = jest.fn()
const node = boardStateNode(boardState(), { dice1: 1, dice2: 3 })

describe('bothSGOperator', () => {
    test('returns always true', () => {
        const ao = bothSGAutoOperator()
        const { redRoll, redPlay } = doRedOperation(ao)

        expect(redRoll).toBeTruthy()
        expect(rollRed).toHaveBeenCalled()
        expect(redPlay).toBeTruthy()
        expect(playRed).toHaveBeenCalled()

        const { whiteRoll, whitePlay } = doWhiteOperation(ao)

        expect(whiteRoll).toBeTruthy()
        expect(rollWhite).toHaveBeenCalled()
        expect(whitePlay).toBeTruthy()
        expect(playWhite).toHaveBeenCalled()
    })
})

describe('redSGOperator', () => {
    test('returns true when it operates for red', () => {
        const ao = redSGAutoOperator()
        const { redRoll, redPlay } = doRedOperation(ao)

        expect(redRoll).toBeTruthy()
        expect(rollRed).toHaveBeenCalled()
        expect(redPlay).toBeTruthy()
        expect(playRed).toHaveBeenCalled()

        const { whiteRoll, whitePlay } = doWhiteOperation(ao)

        expect(whiteRoll).toBeFalsy()
        expect(rollWhite).not.toHaveBeenCalled()
        expect(whitePlay).toBeFalsy()
        expect(playWhite).not.toHaveBeenCalled()
    })
})

describe('whiteSGOperator', () => {
    test('returns true when it operates for white', () => {
        const ao = whiteSGAutoOperator()
        const { redRoll, redPlay } = doRedOperation(ao)

        expect(redRoll).toBeFalsy()
        expect(rollRed).not.toHaveBeenCalled()
        expect(redPlay).toBeFalsy()
        expect(playRed).not.toHaveBeenCalled()

        const { whiteRoll, whitePlay } = doWhiteOperation(ao)
        expect(whiteRoll).toBeTruthy()
        expect(rollWhite).toHaveBeenCalled()
        expect(whitePlay).toBeTruthy()
        expect(playWhite).toHaveBeenCalled()
    })
})

function doRedOperation(ao: SGOperator) {
    const redRoll = ao.operateRollRed(rollRed)
    const redPlay = ao.operateCheckerPlayRed(playRed, node)
    return { redRoll, redPlay }
}
function doWhiteOperation(ao: SGOperator) {
    const whiteRoll = ao.operateRollWhite(rollWhite)
    const whitePlay = ao.operateCheckerPlayWhite(playWhite, node)
    return { whiteRoll, whitePlay }
}

const doDouble = jest.fn()
const doSkipCubeAction = jest.fn()
const doTake = jest.fn()
const doPass = jest.fn()
const alwaysDouble: GammonEngine = simpleEvalEngine(() => 1.0)

describe('bothCBAutoOperator', () => {
    test('returns true when it operates for both', () => {
        const ao = bothCBAutoOperator(alwaysDouble)
        const { redAction, whiteResponse } = doRedCubeActions(ao)
        expect(redAction).toBeTruthy()
        expect(whiteResponse).toBeTruthy()

        const { whiteAction, redResponse } = doWhiteCubeActions(ao)
        expect(redResponse).toBeTruthy()
        expect(whiteAction).toBeTruthy()

        expect(doDouble).toHaveBeenCalledTimes(2)
        expect(doSkipCubeAction).not.toHaveBeenCalled()
        expect(doTake).toHaveBeenCalledTimes(2)
        expect(doPass).not.toHaveBeenCalled()
    })
})

describe('redCBAutoOperator', () => {
    test('returns true when it operates for red', () => {
        const ao = redCBAutoOperator(alwaysDouble)
        const { redAction, whiteResponse } = doRedCubeActions(ao)
        expect(redAction).toBeTruthy()
        expect(whiteResponse).toBeFalsy()

        const { whiteAction, redResponse } = doWhiteCubeActions(ao)
        expect(redResponse).toBeTruthy()
        expect(whiteAction).toBeFalsy()

        expect(doDouble).toHaveBeenCalledTimes(1)
        expect(doSkipCubeAction).not.toHaveBeenCalled()
        expect(doTake).toHaveBeenCalledTimes(1)
        expect(doPass).not.toHaveBeenCalled()
    })
})

describe('whiteCBAutoOperator', () => {
    test('returns true when it operates for white', () => {
        const ao = whiteCBAutoOperator(alwaysDouble)
        const { redAction, whiteResponse } = doRedCubeActions(ao)
        expect(redAction).toBeFalsy()
        expect(whiteResponse).toBeTruthy()

        const { redResponse, whiteAction } = doWhiteCubeActions(ao)

        expect(redResponse).toBeFalsy()
        expect(whiteAction).toBeTruthy()

        expect(doDouble).toHaveBeenCalledTimes(1)
        expect(doSkipCubeAction).not.toHaveBeenCalled()
        expect(doTake).toHaveBeenCalledTimes(1)
        expect(doPass).not.toHaveBeenCalled()
    })
})

function doRedCubeActions(ao: CBOperator) {
    const cubeState = cube(1)
    const board = boardState()
    const redAction = ao.operateRedCubeAction(
        cubeState,
        board,
        doDouble,
        doSkipCubeAction
    )
    const whiteResponse = ao.operateWhiteCubeResponse(
        cubeState,
        board,
        doTake,
        doPass
    )
    return { redAction, whiteResponse }
}
function doWhiteCubeActions(ao: CBOperator) {
    const cubeState = cube(1)
    const board = boardState()
    const whiteAction = ao.operateWhiteCubeAction(
        cubeState,
        board,
        doDouble,
        doSkipCubeAction
    )
    const redResponse = ao.operateRedCubeResponse(
        cubeState,
        board,
        doTake,
        doPass
    )
    return { whiteAction, redResponse }
}
