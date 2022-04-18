import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { unmountComponentAtNode } from 'react-dom'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameBoard } from '../../components/CubefulGameBoard'
import {
    GameState,
    GameStatus,
    toCBState,
    toSGState,
} from '../../dispatchers/utils/GameState'
import { isWhite, setupListeners } from './CubefulGameBoard_utils'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const gameState: GameState = {
    gameStatus: GameStatus.INPLAY_WHITE,
    // prettier-ignore
    absPos: [
        0, 
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 1,-2,
        0,
    ],
    dice1: 6,
    dice2: 6,
}
const state = {
    cpState: undefined,
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}

const props = setupListeners(state, presetDiceSource())

describe('CubeGameBoard(eog)', () => {
    test('plays last move', async () => {
        render(<CubefulGameBoard {...props} />)

        const point = screen.getByTestId(/^point-23/)
        userEvent.click(point)
        expect(state.sgState.tag).toEqual('SGInPlay')
    })

    test('commits last move', async () => {
        const next = { ...props, ...state }
        render(<CubefulGameBoard {...next} />)

        userEvent.click(screen.getAllByTestId(/^dice/)[0])
        expect(state.sgState.tag).toEqual('SGEoG')
        expect(isWhite(state.sgState)).toBeTruthy()
        const expectedEoG = {
            isEndOfGame: true,
            isGammon: false,
            isBackgammon: false,
        }
        expect(
            state.sgState.tag === 'SGEoG' ? state.sgState.eogStatus : undefined
        ).toMatchObject(expectedEoG)
    })

    test('shows dialog after end of game', async () => {
        const next = { ...props, ...state }
        render(<CubefulGameBoard {...next} />)

        expect(state.sgState.tag).toEqual('SGEoG')
        expect(screen.getByText('White wins 1 pt.')).toBeTruthy()
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
