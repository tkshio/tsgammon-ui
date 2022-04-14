import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import {
    CubefulGameBoard,
    CubefulGameConfs,
} from '../../components/CubefulGameBoard'
import { toCBState, toSGState } from '../../dispatchers/utils/GameState'
import { CubeGameListeners } from '../../dispatchers/CubeGameDispatcher'
import { SingleGameListeners } from '../../dispatchers/SingleGameDispatcher'
import { SGState } from '../../dispatchers/SingleGameState'
import { CBState } from '../../dispatchers/CubeGameState'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CheckerPlayListeners } from '../../dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from '../../dispatchers/CheckerPlayState'
import { SingleGameConfs } from '../../components/SingleGameBoard'
import {
    redCBAutoOperator,
    redSGAutoOperator,
} from '../../dispatchers/autoOperators'
import { act } from 'react-dom/test-utils'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    jest.useFakeTimers()
})
const state: {
    cpState?: CheckerPlayState
    sgState: SGState
    cbState: CBState
} = {
    cpState: undefined,
    sgState: toSGState(),
    cbState: toCBState(),
}
function setCPState(next: CheckerPlayState) {
    state.cpState = next
}
function setSGState(next: SGState) {
    state.sgState = next
}
function setCBState(next: CBState) {
    state.cbState = next
}

const cpListeners: CheckerPlayListeners = {
    onCheckerPlay: setCPState,
    onCommitCheckerPlay: () => {
        //
    },
    onUndo: setCPState,
    onRedo: setCPState,
    onRevertDices: setCPState,
}
const sgListeners: SingleGameListeners = {
    onStartOpeningCheckerPlay: setSGState,
    onRerollOpening: setSGState,
    onAwaitRoll: setSGState,
    onStartCheckerPlay: setSGState,
    onEndOfGame: setSGState,
}
const cbListeners: CubeGameListeners = {
    onStartCubeAction: setCBState,
    onAwaitCheckerPlay: setCBState,
    onDouble: setCBState,
    onTake: setCBState,
    onSkipCubeAction: setCBState,
    onEndOfCubeGame: setCBState,
}

const diceSource = presetDiceSource(1, 3, 4, 5)
const props: ComponentProps<typeof CubefulGameBoard> = {
    ...state,
    ...cbListeners,
    ...sgListeners,
    ...cpListeners,
    cbConfs: {
        sgConfs: {
            diceSource,
        },
    },
}
describe('CubeGameBoard', () => {
    test('does opening roll when dice gets clicked', async () => {
        render(<CubefulGameBoard {...props} />)

        // 初期画面とオープニングロール
        const dices = screen.getAllByTestId(/^dice/)
        expect(dices.length).toBe(2)
        dices.forEach((dice) => expect(dice).toBeInTheDocument())
        await userEvent.click(dices[0])
        expect(state.sgState.tag).toEqual('SGInPlay')
    })
    test('moves a piece when point 19 gets clicked', async () => {
        const onCheckerPlay = jest.fn((cp) =>
            (
                props.onCheckerPlay ??
                ((_: CheckerPlayState) => {
                    //
                })
            )(cp)
        )
        const next = { ...props, ...state, onCheckerPlay }
        render(<CubefulGameBoard {...next} />)

        const point = screen.getByTestId(/^point-19/)
        userEvent.click(point)
        expect(onCheckerPlay).toBeCalled()
    })
    test('moves a piece when point 17 gets clicked', async () => {
        const onCheckerPlay = jest.fn((cp) =>
            (
                props.onCheckerPlay ??
                ((_: CheckerPlayState) => {
                    //
                })
            )(cp)
        )
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
        expect(
            state.sgState.tag === 'SGToRoll' ? state.sgState.isRed : false
        ).toBeTruthy()
        expect(state.cbState.tag).toEqual('CBAction')
    })
    test("lets redAutoPlayer do red's ply", async () => {
        const onSkipCubeAction = jest.fn((cb) =>
            (
                props.onSkipCubeAction ??
                ((_: CheckerPlayState) => {
                    //
                })
            )(cb)
        )
        const sgConfs: SingleGameConfs = {
            ...props.cbConfs?.sgConfs,
            autoOperator: redSGAutoOperator(),
        }
        const rao = redCBAutoOperator()
        const ao = {
            ...rao,
            operateRedCubeAction: jest.fn(rao.operateRedCubeAction),
        }
        const cbConfs: CubefulGameConfs = {
            ...props.cbConfs,
            sgConfs,
            autoOperator: ao,
        }

        const next = { ...props, ...state, onSkipCubeAction, cbConfs }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(ao.operateRedCubeAction).toBeCalled()
        expect(onSkipCubeAction).toBeCalled()
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(
            state.sgState.tag === 'SGToRoll' ? state.sgState.isRed : false
        ).toBeTruthy()
    })
})

afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})
