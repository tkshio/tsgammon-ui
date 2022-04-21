import { render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    CubefulGameBoard
} from '../../components/CubefulGameBoard'
import { toCBState, toSGState } from '../../dispatchers/utils/GameState'
import { BoardOp, isRed, isWhite, setupListeners } from './CubefulGameBoard.common'
import { noDoubleEngine, setRedAutoOp, setWhiteAutoOp } from './CubefulGameBoard_autoOp.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    jest.useFakeTimers()
})

const engine: GammonEngine = noDoubleEngine()
const state = {
    cpState: undefined,
    sgState: toSGState(),
    cbState: toCBState(),
}
const diceSource = presetDiceSource(3, 1)
const props = setupListeners(state, diceSource)

describe('CubeGameBoard(with autoOp)', () => {
    test('does opening roll when dice gets clicked', async () => {
        render(<CubefulGameBoard {...props} />)

        // 初期画面とオープニングロール
        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(isRed(state.sgState)).toBeTruthy()
    })

    test("lets redAutoPlayer do checkerPlay", async () => {
        const next = {
            ...props,
            ...state,
            cbConfs: setRedAutoOp(props, engine),
        }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBAction')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test("lets whiteAutoPlayer do cubeAction", async () => {
        const onSkipCubeAction = jest.fn(props.onSkipCubeAction)
        const cbConfs = setWhiteAutoOp(props, engine)
        const next = {
            ...props,
            ...state,
            onSkipCubeAction,
            cbConfs: {
                ...cbConfs,
                autoOperator: cbConfs.autoOperator
                    ? {
                          ...cbConfs.autoOperator,
                          operateWhiteCubeAction: jest.fn(
                              cbConfs.autoOperator?.operateWhiteCubeAction
                          ),
                      }
                    : undefined,
            },
        }

        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(next.cbConfs?.autoOperator?.operateWhiteCubeAction).toBeCalled()
        expect(onSkipCubeAction).toBeCalled()
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test("lets whiteAutoPlayer do Roll", async () => {
        const next = {
            ...props,
            ...state,
            cbConfs: setWhiteAutoOp(props, engine),
        }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBInPlay')
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test("lets whiteAutoPlayer do checkerPlay", async () => {
        const next = {
            ...props,
            ...state,
            cbConfs: setWhiteAutoOp(props, engine),
        }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBAction')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isRed(state.sgState)).toBeTruthy()
    })


    test("lets redAutoPlayer do cubeAction", async () => {
        const onSkipCubeAction = jest.fn(props.onSkipCubeAction)
        const cbConfs = setRedAutoOp(props, engine)
        const next = {
            ...props,
            ...state,
            onSkipCubeAction,
            cbConfs: {
                ...cbConfs,
                autoOperator: cbConfs.autoOperator
                    ? {
                          ...cbConfs.autoOperator,
                          operateRedCubeAction: jest.fn(
                              cbConfs.autoOperator?.operateRedCubeAction
                          ),
                      }
                    : undefined,
            },
        }

        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(next.cbConfs?.autoOperator?.operateRedCubeAction).toBeCalled()
        expect(onSkipCubeAction).toBeCalled()
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isRed(state.sgState)).toBeTruthy()
    })

    test("lets redAutoPlayer do roll", async () => {
        const next = {
            ...props,
            ...state,
            cbConfs: setRedAutoOp(props, engine),
        }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBInPlay')
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(isRed(state.sgState)).toBeTruthy()
    })
})

afterEach(() => {
    // clean up fake timer
    jest.runOnlyPendingTimers()
    jest.useRealTimers()

    // clean up DOM
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})

