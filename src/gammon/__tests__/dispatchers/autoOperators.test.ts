import { boardState, boardStateNode } from 'tsgammon-core'
import {
    bothSGAutoOperator,
    redSGAutoOperator,
    whiteSGAutoOperator,
} from '../../dispatchers/autoOperators'

const rollRed = jest.fn(() => {
    //
})
const rollWhite = jest.fn(() => {
    //
})
const playRed = jest.fn()
const playWhite = jest.fn()
const node = boardStateNode(boardState(), { dice1: 1, dice2: 3 })

describe('bothSGOperators', () => {
    test('returns always true', () => {
        const ao = bothSGAutoOperator()
        const redRoll = ao.operateRollRed(rollRed)
        const whiteRoll = ao.operateRollWhite(rollWhite)
        const redPlay = ao.operateCheckerPlayRed(playRed, node)
        const whitePlay = ao.operateCheckerPlayWhite(playWhite, node)

        expect(redRoll).toBeTruthy()
        expect(whiteRoll).toBeTruthy()
        expect(rollRed).toHaveBeenCalled()
        expect(rollWhite).toHaveBeenCalled()
        expect(redPlay).toBeTruthy()
        expect(playRed).toHaveBeenCalled()
        expect(whitePlay).toBeTruthy()
        expect(playWhite).toHaveBeenCalled()
    })
})
describe('redSGOperators', () => {
    test('returns true when it operates for red', () => {
        const ao = redSGAutoOperator()
        const redRoll = ao.operateRollRed(rollRed)
        const whiteRoll = ao.operateRollWhite(rollWhite)
        const redPlay = ao.operateCheckerPlayRed(playRed, node)
        const whitePlay = ao.operateCheckerPlayWhite(playWhite, node)

        expect(redRoll).toBeTruthy()
        expect(whiteRoll).toBeFalsy()
        expect(rollRed).toHaveBeenCalled()
        expect(rollWhite).not.toHaveBeenCalled()
        expect(redPlay).toBeTruthy()
        expect(playRed).toHaveBeenCalled()
        expect(whitePlay).toBeFalsy()
        expect(playWhite).not.toHaveBeenCalled()
    })
})
describe('whiteSGOperators', () => {
    test('returns true when it operates for white', () => {
        const ao = whiteSGAutoOperator()
        const redRoll = ao.operateRollRed(rollRed)
        const whiteRoll = ao.operateRollWhite(rollWhite)
        const redPlay = ao.operateCheckerPlayRed(playRed, node)
        const whitePlay = ao.operateCheckerPlayWhite(playWhite, node)

        expect(redRoll).toBeFalsy()
        expect(whiteRoll).toBeTruthy()
        expect(rollRed).not.toHaveBeenCalled()
        expect(rollWhite).toHaveBeenCalled()
        expect(redPlay).toBeFalsy()
        expect(playRed).not.toHaveBeenCalled()
        expect(whitePlay).toBeTruthy()
        expect(playWhite).toHaveBeenCalled()
    })
})

