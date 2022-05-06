import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { score, scoreAsWhite, standardConf } from 'tsgammon-core'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../../components/recordedGames/RecordedCubefulGame'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from '../../dispatchers/utils/GameState'
import { setupListeners } from './CubefulGameBoard.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const gameState: GameSetup = {
    gameStatus: GameStatus.EOG_WHITEWON,
    // prettier-ignore
    absPos: [
        0, 
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 0,-2,
        0,
    ],
    stake: scoreAsWhite(1),
}

const state = {
    cpState: undefined,
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}

const props: RecordedCubefulGameProps = {
    ...setupListeners(state, presetDiceSource()),
    gameConf: standardConf,
    bgState: state,
    matchScore: score({ redScore: 0, whiteScore: 2 }),
    matchLength: 3,
    isCrawford: true,
    onStartNextGame: () => {
        //
    },
    onResumeState: () => {
        //
    },
    onEndOfMatch: () => {
        //
    },
}

describe('RecordedCubeGame(eom)', () => {
    test('shows dialog for End of Match', async () => {
        const next = { ...props, ...state }
        render(<RecordedCubefulGame {...next} />)

        expect(state.sgState.tag).toEqual('SGEoG')
        expect(
            screen.getByText('White wins 1 pt. and won the match')
        ).toBeTruthy()
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
