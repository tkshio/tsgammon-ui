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
    setupEventHandlers,
} from './CubefulGame.common'
import {
    noDoubleEngine,
    setRedAutoOp,
    setWhiteAutoOp,
} from './CubefulGame_autoOp.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    jest.useFakeTimers()
})

const engine: GammonEngine = noDoubleEngine()
const bgState = {
    sgState: toSGState(),
    cbState: toCBState(),
}
const state = {
    matchState: matchStateForUnlimitedMatch(),
    cpState: undefined,
    bgState,
}
const diceSource = presetDiceSource(3, 1)
const props = { ...setupEventHandlers(state, diceSource), ...state }

describe('CubeGameBoard(with autoOp)', () => {
    test('does opening roll when dice gets clicked', async () => {
        render(<CubefulGame {...props} />)

        // 初期画面とオープニングロール
        BoardOp.clickRightDice()
        expect(bgState.sgState.tag).toEqual('SGInPlay')
        expect(bgState.cbState.tag).toEqual('CBInPlay')
        expect(isRed(bgState.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do checkerPlay', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators: setRedAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        // Redのプレイが終わり、Whiteのキューブアクション待ち
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(bgState.sgState)).toBeTruthy()
    })

    test('lets whiteAutoPlayer do cubeAction', async () => {
        const onRoll = jest.fn(props.onRoll)
        const autoOperators = setWhiteAutoOp(engine)
        const next = {
            ...props,
            ...state,
            onRoll,

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

        // Whiteはロールした
        expect(next.autoOperators.cb.operateWhiteCubeAction).toBeCalled()
        expect(onRoll).toBeCalled()
        expect(bgState.cbState.tag).toEqual('CBInPlay')
        expect(bgState.sgState.tag).toEqual('SGInPlay')
        expect(isWhite(bgState.sgState)).toBeTruthy()
    })
    test('lets whiteAutoPlayer do checkerPlay', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators: setWhiteAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        // Whiteはチェッカープレイを完了して、Redの手番
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isRed(bgState.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do cubeAction', async () => {
        const onRoll = jest.fn(props.onRoll)
        const autoOperators = setRedAutoOp(engine)
        const next = {
            ...props,
            ...state,
            onRoll,
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
        // Redはロールした
        expect(next.autoOperators.cb.operateRedCubeAction).toBeCalled()
        expect(onRoll).toBeCalled()
        expect(bgState.cbState.tag).toEqual('CBInPlay')
        expect(bgState.sgState.tag).toEqual('SGInPlay')
        expect(isRed(bgState.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do roll', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators: setRedAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        // Redのプレイが完了した
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(bgState.sgState)).toBeTruthy()
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
