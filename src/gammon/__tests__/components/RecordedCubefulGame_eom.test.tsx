import { render, screen } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { scoreAsWhite, standardConf } from 'tsgammon-core'
import {
    matchStateEoG,
    matchStateForPointMatch,
} from 'tsgammon-core/MatchState'
import { eogRecord, matchRecordInPlay } from 'tsgammon-core/records/MatchRecord'
import { plyRecordForEoG } from 'tsgammon-core/records/PlyRecord'
import { BGState } from 'tsgammon-core/states/BGState'
import { CBEoG } from 'tsgammon-core/states/CubeGameState'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from 'tsgammon-core/states/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
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
const conf = standardConf
const bgState = {
    sgState: toSGState(gameState),
    cbState: toCBState(gameState),
}
const matchState = matchStateForPointMatch(3, scoreAsWhite(2))
const { stake, eogStatus } = (bgState.cbState as CBEoG).calcStake(conf)
const eogMatchState = matchStateEoG(matchState, stake, eogStatus)
const eogPlyRecord = plyRecordForEoG(
    stake,
    (bgState.cbState as CBEoG).result,
    eogStatus
)
const initialMatchRecord = eogRecord(
    matchRecordInPlay<BGState>(conf, matchState),
    eogPlyRecord
)

const state = {
    matchState: eogMatchState,
    cpState: undefined,
    bgState,
}
const props: RecordedCubefulGameProps = {
    ...setupEventHandlers(state, presetDiceSource()),
    bgState,
    matchRecord: initialMatchRecord,
    onResumeState: () => {
        //
    },
}
describe('RecordedCubeGame(eom)', () => {
    test('shows dialog for End of Match', async () => {
        const next = { ...props, ...state }
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
