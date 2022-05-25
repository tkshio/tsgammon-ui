import { render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { toCBState, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'
import { matchStateForUnlimitedMatch } from '../../components/MatchState'
import {
    BoardOp,
    isRed,
    isWhite,
    setupEventHandlers
} from './CubefulGame.common'
import {
    noDoubleEngine,
    setRedAutoOp,
    setWhiteAutoOp
} from './CubefulGameBoard_autoOp.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    jest.useFakeTimers()
})

const engine: GammonEngine = noDoubleEngine()
const state = {
    matchState: matchStateForUnlimitedMatch(),
    cpState: undefined,
    sgState: toSGState(),
    cbState: toCBState(),
}
const diceSource = presetDiceSource(3, 1)
const props = { ...setupEventHandlers(state, diceSource), ...state }

describe('CubeGameBoard(with autoOp)', () => {
    test('does opening roll when dice gets clicked', async () => {
        render(<CubefulGame {...props} />)

        // 初期画面とオープニングロール
        BoardOp.clickRightDice()
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(state.cbState.tag).toEqual('CBInPlay')
        expect(isRed(state.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do checkerPlay', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators:setRedAutoOp(engine),
            ...setupEventHandlers(state, diceSource),
        }
        console.log(next)
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBAction')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(state.sgState)).toBeTruthy()
    })
    
    test('lets whiteAutoPlayer do cubeAction', async () => {
        const onSkipCubeAction = jest.fn(props.onSkipCubeAction)
        const autoOperators = setWhiteAutoOp(engine)
        const next = {
            ...props,
            ...state,
            onSkipCubeAction,

            autoOperators: {
                sg: autoOperators.sg,
                cb: {
                    ...autoOperators.cb,
                    operateWhiteCubeAction: jest.fn(
                        autoOperators.cb.operateWhiteCubeAction
                    ),
                },
            },
        }

        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(next.autoOperators.cb.operateWhiteCubeAction).toBeCalled()
        expect(onSkipCubeAction).toBeCalled()
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test('lets whiteAutoPlayer do Roll', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators:setWhiteAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBInPlay')
        expect(state.sgState.tag).toEqual('SGInPlay')
        expect(isWhite(state.sgState)).toBeTruthy()
    })

    test('lets whiteAutoPlayer do checkerPlay', async () => {
        const next = {
            ...props,
            ...state,
        autoOperators:setWhiteAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBAction')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isRed(state.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do cubeAction', async () => {
        const onSkipCubeAction = jest.fn(props.onSkipCubeAction)
        const autoOperators = setRedAutoOp(engine)
        const next = {
            ...props,
            ...state,
            onSkipCubeAction,
            autoOperators: {
                ...autoOperators,
                cb: {
                    ...autoOperators.cb,
                    operateRedCubeAction: jest.fn(
                        autoOperators.cb.operateRedCubeAction
                    ),
                },
            },
        }

        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(next.autoOperators.cb.operateRedCubeAction).toBeCalled()
        expect(onSkipCubeAction).toBeCalled()
        expect(state.cbState.tag).toEqual('CBToRoll')
        expect(state.sgState.tag).toEqual('SGToRoll')
        expect(isRed(state.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do roll', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators:setRedAutoOp( engine),
        }
        render(<CubefulGame {...next} />)
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
