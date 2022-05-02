import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { cube, score } from 'tsgammon-core'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    CubefulGameBoard,
    CubefulGameBoardProps,
} from '../../components/CubefulGameBoard'
import {
    GameState,
    GameStatus,
    toCBState,
    toSGState,
} from '../../dispatchers/utils/GameState'
import { BoardOp, isWhite, setupListeners } from './CubefulGameBoard.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const gameState: GameState = {
    gameStatus: GameStatus.INPLAY_WHITE,
    // prettier-ignore
    absPos: [
        1, 
        -2, -2, -2, -2, -2, -2,   0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 1,-2,
        0,
    ],
    dice1: 6,
    dice2: 6,
    cubeState:cube(1)
}
const state = {
    cpState: undefined,
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}

const props: CubefulGameBoardProps = {
    ...setupListeners(state, presetDiceSource()),
    scoreBefore: score({ redScore: 3, whiteScore: 3 }),
    ...state,
}

describe('CubeGameBoard', () => {
    test('skips cube action when the game is crawford', async () => {
        render(<CubefulGameBoard {...{ ...props, isCrawford:true }} />)

        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.cbState.tag === 'CBToRoll' ?state.cbState.lastAction:undefined).toEqual('Skip')
    })
    test('doesn\'t skip cube action when the game is not crawford', async () => {
        render(<CubefulGameBoard {...{ ...props, isCrawford:false }} />)

        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(state.cbState.tag).toEqual('CBAction')
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
