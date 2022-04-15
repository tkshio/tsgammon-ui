import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { BoardStateNode } from 'tsgammon-core'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { collectNodes } from 'tsgammon-core/utils/collectNodes'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    CBOperator,
    CubefulGameBoard,
    CubefulGameConfs,
} from '../../components/CubefulGameBoard'
import { SGOperator } from '../../components/SingleGameBoard'
import {
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../../dispatchers/autoOperators'
import {
    CheckerPlayListeners,
    setStateListener as setCPStateListener,
} from '../../dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from '../../dispatchers/CheckerPlayState'
import {
    CubeGameListeners,
    setStateListener as setCBStateListener,
} from '../../dispatchers/CubeGameDispatcher'
import { CBState } from '../../dispatchers/CubeGameState'
import {
    setStateListener as setSGStateListener,
    SingleGameListeners,
} from '../../dispatchers/SingleGameDispatcher'
import { SGState } from '../../dispatchers/SingleGameState'
import { toCBState, toSGState } from '../../dispatchers/utils/GameState'

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

const props = setupListeners(state)

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

    test("lets redAutoPlayer do red's cubeAction", async () => {
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

    test("lets redAutoPlayer do red's checkerPlay", async () => {
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

    test("lets redAutoPlayer do red's commit", async () => {
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

    test("lets whiteAutoPlayer do white's cubeAction", async () => {
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

function setupListeners(state: {
    cpState?: CheckerPlayState
    sgState: SGState
    cbState: CBState
}): ComponentProps<typeof CubefulGameBoard> {
    const cpListeners: CheckerPlayListeners = setCPStateListener(
        (next: CheckerPlayState | undefined) => {
            state.cpState = next
        }
    )
    const sgListeners: SingleGameListeners = setSGStateListener(
        (next: SGState) => {
            state.sgState = next
        }
    )
    const cbListeners: CubeGameListeners = setCBStateListener(
        (next: CBState) => {
            state.cbState = next
        }
    )

    const diceSource = presetDiceSource(1, 3, 4, 5)
    return {
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
}

function setRedAutoOp(
    props: ComponentProps<typeof CubefulGameBoard>,
    engine: GammonEngine
): CubefulGameConfs {
    return setAutoOp(
        props,
        redSGAutoOperator(engine),
        redCBAutoOperator(engine)
    )
}
function setWhiteAutoOp(
    props: ComponentProps<typeof CubefulGameBoard>,
    engine: GammonEngine
): CubefulGameConfs {
    return setAutoOp(
        props,
        whiteSGAutoOperator(engine),
        whiteCBAutoOperator(engine)
    )
}

function setAutoOp(
    props: ComponentProps<typeof CubefulGameBoard>,
    sgOp: SGOperator,
    cbOp: CBOperator
): CubefulGameConfs {
    return {
        ...props.cbConfs,
        sgConfs: {
            ...props?.cbConfs?.sgConfs,
            autoOperator: sgOp,
        },
        autoOperator: cbOp,
    }
}

function isRed(sgState: SGState): boolean {
    if (sgState.tag === 'SGOpening') {
        return false
    }
    return sgState.isRed
}
function isWhite(sgState: SGState): boolean {
    if (sgState.tag === 'SGOpening') {
        return false
    }
    return !sgState.isRed
}

function noDoubleEngine(): GammonEngine {
    return {
        initialized: () => {
            //
        },
        cubeAction: () => ({
            isDouble: false,
        }),
        cubeResponse: () => ({ isTake: false }),
        checkerPlay: (boardStateNode: BoardStateNode) => {
            const nodes = collectNodes(boardStateNode)
            return nodes[0]
        },
        endOfGame: () => {
            //
        },
    }
}
