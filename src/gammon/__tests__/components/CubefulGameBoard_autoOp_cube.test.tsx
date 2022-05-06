import { act, render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import {
    GammonEngine,
    simpleEvalEngine,
} from 'tsgammon-core/engines/GammonEngine'
import { evaluate } from 'tsgammon-core/engines/SimpleNNGammon'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameBoard } from '../../components/CubefulGameBoard'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from '../../dispatchers/utils/GameState'
import { setupListeners } from './CubefulGameBoard.common'
import { setRedAutoOp, setWhiteAutoOp } from './CubefulGameBoard_autoOp.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    jest.useFakeTimers()
})
const gameState: GameSetup = {
    gameStatus: GameStatus.CUBEACTION_RED,
    // prettier-ignore
    absPos:[-1,
        0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,  0, 0, 0, 4, 5, 5,
        0
    ],
}
const state = {
    cpState: undefined,
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}
const engine: GammonEngine = simpleEvalEngine((board) => {
    const ev = evaluate(board)
    return ev.e
})

const props = {...setupListeners(state, presetDiceSource(1, 3)), ...state}

describe('CubeGameBoard', () => {
    test('lets redAutoPlayer do cubeAction', async () => {
        const cbConfs = setRedAutoOp(props, engine)
        const next = {
            ...props,
            ...state,
            cbConfs,
        }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBResponse')
        expect(state.sgState.tag).toEqual('SGToRoll')
    })
    test('lets whiteAutoPlayer do pass', async () => {
        const cbConfs = setWhiteAutoOp(props, engine)
        const next = {
            ...props,
            ...state,
            cbConfs,
        }
        render(<CubefulGameBoard {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(state.cbState.tag).toEqual('CBEoG')
        expect(state.sgState.tag).toEqual('SGToRoll')
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
