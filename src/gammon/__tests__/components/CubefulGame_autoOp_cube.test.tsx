import { act, render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import {
    GammonEngine,
    simpleEvalEngine,
} from 'tsgammon-core/engines/GammonEngine'
import { evaluate } from 'tsgammon-core/engines/SimpleNNGammon'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'
import { matchStateForUnlimitedMatch } from '../../components/MatchState'
import { setupEventHandlers } from './CubefulGame.common'
import { setRedAutoOp, setWhiteAutoOp } from './CubefulGame_autoOp.common'

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
const bgState = {
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}
const state = {
    matchState: matchStateForUnlimitedMatch(),
    cpState: undefined,
    bgState,
}
const engine: GammonEngine = simpleEvalEngine((board) => {
    const ev = evaluate(board)
    return ev.e
})

const props = { ...setupEventHandlers(state, presetDiceSource(1, 3)), ...state }

describe('CubeGameBoard', () => {
    test('lets redAutoPlayer do cubeAction', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators: setRedAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(bgState.cbState.tag).toEqual('CBResponse')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
    })
    test('lets whiteAutoPlayer do pass', async () => {
        const next = {
            ...props,
            ...state,
            autoOperators: setWhiteAutoOp(engine),
        }
        render(<CubefulGame {...next} />)
        act(() => {
            jest.advanceTimersByTime(10)
        })
        expect(bgState.cbState.tag).toEqual('CBEoG')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
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
