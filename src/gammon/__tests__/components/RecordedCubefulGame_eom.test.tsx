import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { score, scoreAsWhite, standardConf } from 'tsgammon-core'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import { matchStateEOG, matchStateForPointMatch } from 'tsgammon-core/dispatchers/MatchState'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { matchRecord } from 'tsgammon-core/records/MatchRecord'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps
} from '../../components/recordedGames/RecordedCubefulGame'
import { setupEventHandlers } from './CubefulGame.common'


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

const bgState = {
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}

const state = {
    matchState: matchStateEOG(
        matchStateForPointMatch(3, score({ redScore: 0, whiteScore: 2 })),
        bgState.cbState as CBEoG
    ),
    cpState: undefined,
    bgState,
}
const initialMatchRecord = matchRecord<BGState>()
const props: RecordedCubefulGameProps = {
    ...setupEventHandlers(state, presetDiceSource()),
    gameConf: standardConf,
    bgState,
    matchState: state.matchState,
    matchRecord: initialMatchRecord,
    cbConfs: { sgConfs: {} },
    onResumeState: () => {
        //
    },
}
describe('RecordedCubeGame(eom)', () => {
    test('shows dialog for End of Match', async () => {
        const next = { ...props, ...state}
        render(<RecordedCubefulGame {...next} />)

        expect(bgState.sgState.tag).toEqual('SGEoG')
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
