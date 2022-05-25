import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { score, scoreAsWhite, standardConf } from 'tsgammon-core'
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { matchRecord } from 'tsgammon-core/records/MatchRecord'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    matchStateEOG,
    matchStateForPointMatch,
} from '../../components/MatchState'
import { BGState } from '../../components/BGState'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
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

const state = {
    matchState: matchStateEOG(
        matchStateForPointMatch(3, score({ redScore: 0, whiteScore: 2 })),
        toCBState(gameState) as CBEoG
    ),
    cpState: undefined,
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}
const initialMatchRecord = matchRecord<BGState>()
const props: RecordedCubefulGameProps = {
    ...setupEventHandlers(state, presetDiceSource()),
    gameConf: standardConf,
    bgState: state,
    matchState:state.matchState,
    matchRecord: initialMatchRecord,
    cbConfs: { sgConfs: {} },
    onResumeState: () => {
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
