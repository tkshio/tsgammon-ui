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
import { BoardOp } from './CubefulGame.common'

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
            rollListener({ diceSource: presetDiceSource(1, 3) }),
            setSGStateListener(
                initialState,
                (state: SGState) => (props.sgState = state)
            )
        ),
    }

    test('renders blank dice and pieces for Opening state', async () => {
        render(<SingleGameBoard {...props} />)
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

        assertPositions(pos)
        assertAbsBoardPositions(props.cpState?.absBoard!, pos)
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

        console.log(props.sgState.boardState.points)
        assertPositions(pos)
        assertAbsBoardPositions(props.sgState.absBoard, pos)
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
    screen
        .getByTestId(`dice-${side}`)
        .querySelectorAll(`div.dice > div`)
        ?.forEach((e, idx) => {
            expect(e.className).toBe(
                `pip d${dices[idx].pip + (dices[idx].used ? ' used' : '')}`
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
