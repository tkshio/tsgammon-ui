import { act, render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { toCBState, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import {
    BoardOp,
    isRed,
    isWhite,
    setupEventHandlers,
} from './CubefulGame.common'
import { CubefulGame } from '../../components/CubefulGame'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/MatchState'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})
const bgState = {
    sgState: toSGState(),
    cbState: toCBState(),
}

const state = {
    matchState: matchStateForUnlimitedMatch(),
    cpState: undefined,
    bgState,
}
const diceSource = presetDiceSource(1, 3)
describe('CubeGame', () => {
    test('does opening roll when dice gets clicked', async () => {
        render(
            <CubefulGame
                {...{
                    ...state,
                    ...setupEventHandlers(state, diceSource),
                }}
            />
        )

        // 初期画面とオープニングロール
        const dices = screen.getAllByTestId(/^dice/)
        expect(dices.length).toBe(2)
        await act(() => BoardOp.clickRightDice())
        expect(bgState.sgState.tag).toEqual('SGInPlay')
        expect(bgState.cbState.tag).toEqual('CBInPlay')
        expect(isWhite(bgState.sgState)).toBeTruthy()
    })

    test('moves a piece when point 19 gets clicked', async () => {
        const handlers = setupEventHandlers(state, diceSource)
        const onCheckerPlay = jest.fn(handlers.onCheckerPlay)
        const next = { ...state, ...handlers, onCheckerPlay }
        render(<CubefulGame {...next} />)
        BoardOp.clickPoint(19)
        expect(onCheckerPlay).toBeCalled()
    })

    test('moves a piece when point 17 gets clicked', async () => {
        const handlers = setupEventHandlers(state, diceSource)
        const onCheckerPlay = jest.fn(handlers.onCheckerPlay)
        const next = { ...state, ...handlers, onCheckerPlay }
        render(<CubefulGame {...next} />)

        BoardOp.clickPoint(17)
        expect(onCheckerPlay).toBeCalled()
    })

    test("commits one's ply when dice gets clicked", async () => {
        const next = {
            ...state,
            ...setupEventHandlers(state, diceSource),
        }
        render(<CubefulGame {...next} />)
        await BoardOp.clickRightDice()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(isRed(bgState.sgState)).toBeTruthy()
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
