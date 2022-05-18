import { render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { cube, score } from 'tsgammon-core'
import { GameSetup, GameStatus, toCBState, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame, CubefulGameProps } from '../../components/CubefulGame'
import { BoardOp, setupEventHandlers } from './CubefulGame.common'


let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

// 白の手番だが、オンザバーなので手がなく、即コミットしかない状態
const gameState: GameSetup = {
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

const props: CubefulGameProps = {
    ...setupEventHandlers(state, presetDiceSource()),
    matchScore: score({ redScore: 3, whiteScore: 3 }),
    ...state,
}

describe('CubefulGame', () => {
    test('skips cube action when the game is crawford', async () => {
        render(<CubefulGame {...{ ...props, isCrawford:true }} />)

        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.cbState.tag === 'CBToRoll' ?state.cbState.lastAction:undefined).toEqual('Skip')
    })
    test('doesn\'t skip cube action when the game is not crawford', async () => {
        render(<CubefulGame {...{ ...props, isCrawford:false }} />)

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
