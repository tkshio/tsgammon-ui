import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'
import { BoardOp, isWhite, setupEventHandlers } from './CubefulGame.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const gameState: GameSetup = {
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

const props = setupEventHandlers(state, presetDiceSource())

describe('CubeGame(eog)', () => {
    test('plays last move', async () => {
        render(<CubefulGame {...{...props, ...state}} />)

        BoardOp.clickPoint(23)
        expect(state.sgState.tag).toEqual('SGInPlay')
    })

    test('commits last move', async () => {
        const next = { ...props, ...state }
        render(<CubefulGame {...next} />)

        BoardOp.clickRightDice()
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
        render(<CubefulGame {...next} />)

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
