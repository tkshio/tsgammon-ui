import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/MatchState'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'
import { BoardOp, setupEventHandlers } from './CubefulGame.common'

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
    const bgState = {
        sgState: toSGState(gameState),
        cbState: toCBState(gameState),
    }
    const state = {
        matchState: matchStateForUnlimitedMatch(undefined, true),

        cpState: undefined,
        bgState,
    }
    const props = {
        ...setupEventHandlers(state, randomDiceSource),
        cbConfs: {
            sgConfs: {},
            stakeConf: { jacobyRule: true },
        },
        ...state,
    }

    test('do last move', () => {
        render(<CubefulGame {...props} />)
        BoardOp.clickRightDice()
        expect(bgState.sgState.tag).toEqual('SGEoG')
    })
    test('end of the game', () => {
        render(
            <CubefulGame
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
    const bgState = {
        sgState: toSGState(gameState),
        cbState: toCBState(gameState),
    }
    const state = {
        matchState: matchStateForUnlimitedMatch(undefined, false),
        cpState: undefined,
        bgState,
    }

    const props = {
        ...setupEventHandlers(state, randomDiceSource),
        cbConfs: {
            sgConfs: {},
            stakeConf: { jacobyRule: false },
        },
        ...state,
    }

    test('do last move', () => {
        render(<CubefulGame {...props} />)
        BoardOp.clickLeftDice()
        expect(bgState.sgState.tag).toEqual('SGEoG')
    })
    test('end of the game', () => {
        render(
            <CubefulGame
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
