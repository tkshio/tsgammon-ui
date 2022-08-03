import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { score } from 'tsgammon-core'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { matchStateForPointMatch } from 'tsgammon-core/MatchState'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'

import { BoardOp, isRed, isWhite, setupEventHandlers } from './CubefulGame.common'

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
const bgState = {
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}
const matchState = matchStateForPointMatch(
    3,
    score({ redScore: 0, whiteScore: 2 })
)
const state = {
    matchState,
    cpState: undefined,
    bgState,
}

const props = { ...setupEventHandlers(state, presetDiceSource()) }
describe('CubeGame(eog)', () => {
    test('plays last move', async () => {
        render(<CubefulGame {...{ ...props, ...state }} />)

        BoardOp.clickPoint(23)
        expect(bgState.sgState.tag).toEqual('SGInPlay')
    })

    test('commits last move', async () => {
        const next = { ...props, ...state }
        render(<CubefulGame {...next} />)

        BoardOp.clickRightDice()
        expect(bgState.sgState.tag).toEqual('SGEoG')
        // SGEoGはredでもwhiteでもない状態
        expect(isWhite(bgState.sgState)).toBeFalsy()
        expect(isRed(bgState.sgState)).toBeFalsy()
        const expectedEoG = {
            isEndOfGame: true,
            isGammon: false,
            isBackgammon: false,
        }
        expect(
            bgState.sgState.tag === 'SGEoG'
                ? bgState.sgState.eogStatus
                : undefined
        ).toMatchObject(expectedEoG)
    })

    test('shows dialog after end of game', async () => {
        const next = { ...props, ...state }
        render(<CubefulGame {...next} />)

        expect(bgState.sgState.tag).toEqual('SGEoG')

        expect(bgState.cbState.tag).toEqual('CBEoG')
        expect(
            screen.getByText('White wins 1 pt. and won the match')
        ).toBeTruthy()
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
