import { act, render, screen } from '@testing-library/react'

import { unmountComponentAtNode } from 'react-dom'
import { AbsoluteBoardState, Dice, dice, standardConf } from 'tsgammon-core'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BlankDice, blankDice } from '../../components/boards/Dice'
import { buildSGEventHandler } from '../../components/dispatchers/buildSGEventHandler'
import { setCPStateListener } from '../../components/dispatchers/CheckerPlayDispatcher'
import { rollListener } from '../../components/dispatchers/RollDispatcher'
import {
    setSGStateListener,
    singleGameDispatcher,
} from '../../components/dispatchers/SingleGameDispatcher'
import {
    SingleGameBoard,
    SingleGameBoardProps,
} from '../../components/SingleGameBoard'
import { BoardOp, isRed, isWhite } from './CubefulGame.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

describe('SingleGameBoard', () => {
    const initialState = toSGState()
    const props: SingleGameBoardProps = {
        cpState: undefined,
        sgState: initialState,
        ...setCPStateListener((state) => (props.cpState = state)),
        ...buildSGEventHandler(
            singleGameDispatcher(standardConf.transition),
            rollListener({ diceSource: presetDiceSource(1, 3, 4, 2) }),
            setSGStateListener(
                initialState,
                (state: SGState) => (props.sgState = state)
            )
        ),
    }

    test('renders blank dice and pieces for Opening state', async () => {
        render(<SingleGameBoard {...props} />)
        expect(isWhite(props.sgState)).toBeFalsy()
        expect(isRed(props.sgState)).toBeFalsy()
        assertPositions(standardConf.initialPos)
        assertDices([blankDice], 'right')
        assertDices([blankDice], 'left')
        await act(async () => {
            BoardOp.clickRightDice()
        })
    })

    test('transits to InPlay state and renders rolled dice', async () => {
        const { rerender } = render(<SingleGameBoard {...props} />)
        assertDices([dice(1), dice(3)], 'right')
        assertPositions(standardConf.initialPos)
        await act(async () => {
            BoardOp.clickPoint(19)
        })
        rerender(<SingleGameBoard {...props} />)
        await act(async () => {
            BoardOp.clickPoint(17)
        })
        assertAbsBoardPositions(
            props.cpState!.absBoard,
            // prettier-ignore
            [0,
                 2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
                -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
                0]
        )
        expect(isWhite(props.sgState)).toBeTruthy()
        assertNoDices('left')
    })

    test('reverts / re-reverts position with undo button', async () => {
        const { rerender } = render(<SingleGameBoard {...props} />)
        assertDices([dice(1, true), dice(3, true)], 'right')
        await act(async () => {
            BoardOp.clickRevertButton()
        })
        rerender(<SingleGameBoard {...props} />)
        assertDices([dice(1), dice(3)], 'right')
        assertAbsBoardPositions(
            props.cpState!.absBoard,
            // prettier-ignore
            [0,
                 2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
                -5, 0, 0, 0, 3, 0, /* bar */ 5, 0, 0, 0, 0,-2,
                0]
        )
        assertNoDices('left')
        await act(async () => {
            BoardOp.clickRevertButton()
        })
        expect(isWhite(props.sgState)).toBeTruthy()
        assertDices([dice(1), dice(3)], 'right')
        assertAbsBoardPositions(
            props.cpState!.absBoard,
            // prettier-ignore
            [0,
                 2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
                -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
                0]
        )
    })
    test('makes block when empty point gets clicked', async () => {
        const { rerender } = render(<SingleGameBoard {...props} />)

        await act(async () => {
            BoardOp.clickPoint(20)
        })
        rerender(<SingleGameBoard {...props} />)
        const pos =
            // prettier-ignore
            [0,
                2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
               -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
               0]

        expect(isWhite(props.sgState)).toBeTruthy()
        assertPositions(pos)
        assertAbsBoardPositions(props.cpState!.absBoard, pos)
        assertDices([dice(1, true), dice(3, true)], 'right')
    })
    test('turns board after commit', async () => {
        const { rerender } = render(<SingleGameBoard {...props} />)

        await act(async () => {
            BoardOp.clickRightDice()
        })
        rerender(<SingleGameBoard {...props} />)
        const pos =
            // prettier-ignore
            [0,
             2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
            -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
            0]
        expect(isRed(props.sgState)).toBeTruthy()
        assertPositions(pos)
        assertAbsBoardPositions(props.sgState.absBoard, pos)
    })

    test('rolls dice for red when left dices gets clicked', async () => {
        const { rerender } = render(<SingleGameBoard {...props} />)

        await act(async () => {
            BoardOp.clickLeftDice()
        })
        rerender(<SingleGameBoard {...props} />)
        const pos =
            // prettier-ignore
            [0,
             2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
            -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
            0]

        expect(isRed(props.sgState)).toBeTruthy()
        assertPositions(pos)
        assertDices([dice(4), dice(2)], 'left')
    })

    test('makes block when empty point gets clicked(red)', async () => {
        const { rerender } = render(<SingleGameBoard {...props} />)

        await act(async () => {
            BoardOp.clickPoint(4)
        })
        rerender(<SingleGameBoard {...props} />)
        const pos =
            // prettier-ignore
            [0,
                2, 0, 0,-2, 0,-4, /* bar */ 0,-2, 0, 0, 0, 5,
               -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
               0]
        expect(props.sgState.tag).toBe('SGInPlay')
        expect(isRed(props.sgState)).toBeTruthy()
        assertPositions(pos)
        assertAbsBoardPositions(props.cpState!.absBoard, pos)
        assertDices([dice(4, true), dice(2, true)], 'left')
    })
})

function assertAbsBoardPositions(aBoard: AbsoluteBoardState, pos: number[]) {
    aBoard.points().forEach((num, index) => expect(num).toBe(pos[index]))
}
function assertPositions(pos: number[]) {
    pos.forEach((v, index) => {
        if (v > 0) {
            expect(
                (
                    screen
                        .getByTestId(`point-${index}`)
                        .querySelector('div.white') ?? {
                        childNodes: { length: -99 },
                    }
                ).childNodes.length
            ).toBe(v)
        } else if (v < 0) {
            expect(
                (
                    screen
                        .getByTestId(`point-${index}`)
                        .querySelector('div.red') ?? {
                        childNodes: { length: -99 },
                    }
                ).childNodes.length
            ).toBe(-v)
        } else {
            expect(
                screen.getByTestId(`point-${index}`).querySelector('div > div')
                    ?.childElementCount
            ).toBe(0)
        }
    })
}

function assertNoDices(side: 'right' | 'left') {
    expect(
        screen.getByTestId(`dice-${side}`).querySelector(`div.dice > div`)
    ).toBeNull()
}

function assertDices(dices: (Dice | BlankDice)[], side: 'right' | 'left') {
    dices.forEach((dice, idx) => {
        const e = screen
            .getByTestId(`dice-${side}`)
            .querySelectorAll(`div.dice > div`)
            .item(idx)
        expect(e.className).toBe(
            `pip d${dice.pip + (dice.used ? ' used' : '')}`
        )
    })
}
afterEach(() => {
    // clean up DOM
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})
