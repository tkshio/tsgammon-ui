import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { unmountComponentAtNode } from 'react-dom'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameBoard } from '../../components/CubefulGameBoard'
import { toCBState, toSGState } from '../../dispatchers/utils/GameState'
import { isRed, isWhite, setupListeners } from './CubefulGameBoard_utils'

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
        dices.forEach((dice) => expect(dice).toBeInTheDocument())
        userEvent.click(dices[0])
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test('moves a piece when point 19 gets clicked', async () => {
        const onCheckerPlay = jest.fn(props.onCheckerPlay)
        const next = { ...props, ...state, onCheckerPlay }
        render(<CubefulGameBoard {...next} />)

        const point = screen.getByTestId(/^point-19/)
        userEvent.click(point)
        expect(onCheckerPlay).toBeCalled()
    })

    test('moves a piece when point 17 gets clicked', async () => {
        const onCheckerPlay = jest.fn(props.onCheckerPlay)
        const next = { ...props, ...state, onCheckerPlay }
        render(<CubefulGameBoard {...next} />)

        const point = screen.getByTestId(/^point-17/)
        userEvent.click(point)
        expect(onCheckerPlay).toBeCalled()
    })

    test("commits one's ply when dice gets clicked", async () => {
        const next = { ...props, ...state }
        render(<CubefulGameBoard {...next} />)

        const whiteDice = screen.getByTestId(/^dice-right/)
        userEvent.click(whiteDice)
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
