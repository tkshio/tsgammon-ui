import { render, screen } from '@testing-library/react'
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
import { matchStateForUnlimitedMatch } from '../../components/MatchState'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const state = {
    matchState: matchStateForUnlimitedMatch(),
    cpState: undefined,
    sgState: toSGState(),
    cbState: toCBState(),
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
        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(state.cbState.tag).toEqual('CBInPlay')
        expect(isWhite(state.sgState)).toBeTruthy()
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
