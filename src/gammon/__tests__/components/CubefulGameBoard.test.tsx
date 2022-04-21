import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameBoard } from '../../components/CubefulGameBoard'
import { toCBState, toSGState } from '../../dispatchers/utils/GameState'
import { BoardOp, isRed, isWhite, setupListeners } from './CubefulGameBoard.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const state = {
    cpState: undefined,
    sgState: toSGState(),
    cbState: toCBState(),
}

const props = setupListeners(state, presetDiceSource(1, 3))
 
describe('CubeGameBoard', () => {
    test('does opening roll when dice gets clicked', async () => {
        render(<CubefulGameBoard {...props} />)

        // 初期画面とオープニングロール
        const dices = screen.getAllByTestId(/^dice/)
        expect(dices.length).toBe(2)
        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test('moves a piece when point 19 gets clicked', async () => {
        const onCheckerPlay = jest.fn(props.onCheckerPlay)
        const next = { ...props, ...state, onCheckerPlay }
        render(<CubefulGameBoard {...next} />)
        BoardOp.clickPoint(19)
        expect(onCheckerPlay).toBeCalled()
    })

    test('moves a piece when point 17 gets clicked', async () => {
        const onCheckerPlay = jest.fn(props.onCheckerPlay)
        const next = { ...props, ...state, onCheckerPlay }
        render(<CubefulGameBoard {...next} />)

        BoardOp.clickPoint(17)
        expect(onCheckerPlay).toBeCalled()
    })

    test("commits one's ply when dice gets clicked", async () => {
        const next = { ...props, ...state }
        render(<CubefulGameBoard {...next} />)

        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(state.cbState.tag).toEqual('CBAction')
        expect(isRed(state.sgState)).toBeTruthy()
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
