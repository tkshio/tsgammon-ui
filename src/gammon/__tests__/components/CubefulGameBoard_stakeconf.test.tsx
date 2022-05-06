import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameBoard } from '../../components/CubefulGameBoard'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { BoardOp, setupListeners } from './CubefulGameBoard.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})
const gameState: GameSetup = {
    gameStatus: GameStatus.INPLAY_RED,
    // prettier-ignore
    absPos: [
        0, 
        15, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
        0,
    ],
    dice1: 1,
    dice2: 2,
}

describe('stakeConf configures jacoby rule(on):', () => {
    const state = {
        cpState: undefined,
        sgState: toSGState(gameState),
        cbState: toCBState(gameState),
    }

    const props = {
        ...setupListeners(state, randomDiceSource),
        cbConfs: {
            sgConfs: {},
            stakeConf: { jacobyRule: true },
        },
        ...state
    }

    test('do last move', () => {
        render(<CubefulGameBoard {...props} />)
        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGEoG')
    })
    test('end of the game', () => {
        render(
            <CubefulGameBoard
                {...{
                    ...props,
                    ...state,
                }}
            />
        )
        expect(screen.getByText('Red wins 1 pt.')).toBeTruthy()
    })
})
describe('stakeConf configures jacoby rule off', () => {
    const state = {
        cpState: undefined,
        sgState: toSGState(gameState),
        cbState: toCBState(gameState),
    }

    const props = {
        ...setupListeners(state, randomDiceSource),
        cbConfs: {
            sgConfs: {},
            stakeConf: { jacobyRule: false },
        },
        ...state
    }

    test('do last move', () => {
        render(<CubefulGameBoard {...props} />)
        BoardOp.clickLeftDice()
        expect(state.sgState.tag).toEqual('SGEoG')
    })
    test('end of the game', () => {
        render(
            <CubefulGameBoard
                {...{
                    ...props,
                    ...state,
                }}
            />
        )
        expect(screen.getByText('Red wins 3 pt. by Backgammon')).toBeTruthy()
    })
})

afterEach(() => {
    // clean up DOM
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})
