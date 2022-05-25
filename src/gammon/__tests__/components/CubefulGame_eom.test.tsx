import { render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { cube, score } from 'tsgammon-core'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'
import { MatchStateInPlay } from '../../components/MatchState'
import { BoardOp, setupEventHandlers } from './CubefulGame.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

// 白の手番だが、オンザバーなので手がなく、即コミットしかない状態
const gameState: GameSetup = {
    gameStatus: GameStatus.INPLAY_WHITE,
    // prettier-ignore
    absPos: [
        1, 
        -2, -2, -2, -2, -2, -2,   0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 1,-2,
        0,
    ],
    dice1: 6,
    dice2: 6,
    cubeState: cube(1),
}

const matchState: MatchStateInPlay = {
    isEoG: false,
    matchLength: 5,
    stakeConf: { jacobyRule: false },
    scoreBefore: score({ redScore: 4, whiteScore: 3 }),
    isCrawford: true,
}

describe('CubefulGame', () => {
    test('skips cube action when the game is crawford', async () => {
        const bgState = {
            sgState: toSGState(gameState),
            cbState: toCBState(gameState),
        }
        const state = {
            matchState,
            cpState: undefined,
            bgState,
        }
        const props = {
            matchState,
            ...setupEventHandlers(
                state,
                presetDiceSource(),
                matchState.isCrawford
            ),
        }

        render(<CubefulGame {...{ ...props, ...state }} />)

        BoardOp.clickRightDice()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(bgState.cbState.tag).toEqual('CBToRoll')
        expect(
            bgState.cbState.tag === 'CBToRoll'
                ? bgState.cbState.lastAction
                : undefined
        ).toEqual('Skip')
    })
    test("doesn't skip cube action when the game is not crawford", async () => {
        const bgState = {
            sgState: toSGState(gameState),
            cbState: toCBState(gameState),
        }
        const state = {
            matchState,
            cpState: undefined,
            bgState,
        }
        const props = {
            matchState,
            ...setupEventHandlers(
                state,
                presetDiceSource(),
                matchState.isCrawford
            ),
        }
        render(
            <CubefulGame
                {...{
                    ...props,
                    ...state,
                    ...setupEventHandlers(state, presetDiceSource(), false),
                }}
            />
        )

        BoardOp.clickRightDice()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(bgState.cbState.tag).toEqual('CBAction')
    })
})

afterEach(() => {
    // clean up DOM
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})
