import { act, render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import {
    matchStateForUnlimitedMatch
} from 'tsgammon-core/MatchState'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import {
    GammonEngine,
    simpleEvalEngine
} from 'tsgammon-core/engines/GammonEngine'
import { evaluate } from 'tsgammon-core/engines/SimpleNNGammon'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { AutoOperateCBGame } from './AutoOperateCBGame'
import { BoardOp, isWhite, setupEventHandlers } from './CubefulGame.common'
import { setRedAutoOp, setWhiteAutoOp } from './CubefulGame_autoOp.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    jest.useFakeTimers()
})

function setup(gameSetup?: GameSetup) {
    const bgState = {
        sgState: toSGState(gameSetup),
        cbState: toCBState(gameSetup),
    }
    const matchState = matchStateForUnlimitedMatch()
    const state = {
        matchState,
        cpState: undefined,
        bgState,
    }
    const diceSource = presetDiceSource(3, 1)
    const props = { ...setupEventHandlers(state, diceSource), ...state }
    return { props, bgState, matchState }
}

const engineAlwaysPass: GammonEngine = {
    ...simpleEvalEngine((board) => {
        const ev = evaluate(board)
        return ev.e
    }),
    cubeResponse: (_, __) => {
        return {isTake:false}
    },
}
describe('CubeGameBoard', () => {
    test('lets redAutoPlayer do cubeAction', async () => {
        const { props, bgState } = setup({
            gameStatus: GameStatus.INPLAY_WHITE,
            // prettier-ignore
            absPos:[1,
            -2, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
             0
        ],
            dice1: 1,
            dice2: 1,
        })
        const next = {
            ...props,
            autoOperators: setRedAutoOp(engineAlwaysPass),
        }
        render(<AutoOperateCBGame {...next} />)

        await act(BoardOp.clickRightDice)
        expect(isWhite(bgState.cbState)).toBeTruthy()
        expect(bgState.cbState.tag).toEqual('CBResponse')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
    })
    test('lets whiteAutoPlayer do pass', async () => {
        const { props, bgState } = setup({
            gameStatus: GameStatus.CUBEACTION_RED,
            // prettier-ignore
            absPos:[1,
            -2, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
             0
        ],
        })
        const next = {
            ...props,
            autoOperators: setWhiteAutoOp(engineAlwaysPass),
        }
        render(<AutoOperateCBGame {...next} />)
        await act(async () => {
            await BoardOp.clickCube()
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
