import { render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { EOGStatus } from 'tsgammon-core'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/MatchState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { BGState, toState } from 'tsgammon-core/states/BGState'
import { ResignState, RSNONE } from 'tsgammon-core/states/ResignState'
import { GameStatus } from 'tsgammon-core/states/utils/GameSetup'
import { CubefulGame } from '../../../components/CubefulGame'
import { setBGStateListener } from '../../../components/dispatchers/BGEventHandler'
import { buildBGEventHandler } from '../../../components/dispatchers/buildBGEventHandler'
import { eogEventHandler } from '../../../components/dispatchers/EOGEventHandlers'
import { operateWithRS } from '../../../components/operateWithRS'
import {
    bothRSAutoOperator,
    redRSAutoOperator,
    whiteRSAutoOperator,
} from '../../../components/operators/RSAutoOperators'
import {
    RSDialogHandler,
    rsDialogHandler,
    RSToOffer,
} from '../../../components/RSDialogHandler'
import { BoardOp } from '../CubefulGame.common'
import { alwaysAccept, alwaysOffer } from './Resign.common'

let container: HTMLElement | null = null
const state: { resignState: ResignState | RSToOffer } = {
    resignState: RSNONE,
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    state.resignState = RSNONE
})

const rsHandler: RSDialogHandler = rsDialogHandler(
    (resignState: ResignState | RSToOffer) => {
        state.resignState = resignState
    },
    () => {
        //
    }
)

describe('ResignDialog', () => {
    test('offers resign(red)', async () => {
        const bgState = toState({
            gameStatus: GameStatus.INPLAY_WHITE,
            // prettier-ignore
            absPos: [
                0,
                1,  0,  0, -2,  0,  0,   0, 0, 0, 0, 0, 0,
                0,  0,  0,  0,  0,  0,   0, 0, 0, 0, 0, 0, 
                0,
            ],
            dice1: 3,
            dice2: 3,
        })
        const setBGState = (nextBGState: BGState) => {
            bgState.cbState = nextBGState.cbState
            bgState.sgState = nextBGState.sgState
        }
        const rs = redRSAutoOperator({
            offerAction: alwaysOffer(ResignOffer.Single),
            offerResponse: alwaysAccept,
        })

        const bgHandler = buildBGEventHandler(
            () => false,
            undefined,
            setBGStateListener(bgState, setBGState)
        )
        const { bgListener, rsDialogHandler: resignEventHandler } =
            operateWithRS(bgState, rs, rsHandler)
        const bgEventHandler = bgHandler.addListener(bgListener)

        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...bgEventHandler,
            ...resignEventHandler,
        }
        render(<CubefulGame {...cbProps} />)
        await BoardOp.clickRightDice()
        setTimeout(() => expect(state.resignState.tag).toBe('RSOffered'), 0)
    })

    test('offers resign(white)', async () => {
        const bgState = toState({
            gameStatus: GameStatus.INPLAY_RED,
            // prettier-ignore
            absPos: [
                0,
                0,  0,  0,  0,  0,  0,   0, 0, 0, 0, 0, 0,
                0,  0,  0,  0,  0,  0,   0, 0, 2, 0, 0, -1, 
                0,
            ],
            dice1: 3,
            dice2: 3,
        })
        const setBGState = (nextBGState: BGState) => {
            bgState.cbState = nextBGState.cbState
            bgState.sgState = nextBGState.sgState
        }
        const rs = whiteRSAutoOperator({
            offerAction: alwaysOffer(ResignOffer.Single),
            offerResponse: alwaysAccept,
        })

        const bgHandler = buildBGEventHandler(
            () => true,
            undefined,
            setBGStateListener(bgState, setBGState)
        )
        const { bgListener, rsDialogHandler: resignEventHandler } =
            operateWithRS(bgState, rs, rsHandler)
        const bgEventHandler = bgHandler.addListener(bgListener)

        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...bgEventHandler,
            ...resignEventHandler,
        }
        render(<CubefulGame {...cbProps} />)
        await BoardOp.clickLeftDice()

        setTimeout(() => expect(state.resignState.tag).toBe('RSOffered'), 0)
    })

    test('offers resign(both)', async () => {
        const bgState = toState({
            gameStatus: GameStatus.INPLAY_RED,
            // prettier-ignore
            absPos: [
                0,
                0,  0,  0,  0,  0,  0,   0, 0, 0, 0, 0, 0,
                0,  0,  0,  0,  0,  0,   0, 0, 2, 0, 0, -1, 
                0,
            ],
            dice1: 3,
            dice2: 3,
        })

        const setBGState = (nextBGState: BGState) => {
            bgState.cbState = nextBGState.cbState
            bgState.sgState = nextBGState.sgState
        }
        const rs = bothRSAutoOperator(
            {
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            },
            {
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            }
        )

        const listeners = [setBGStateListener(bgState, setBGState)]

        const bgHandler = buildBGEventHandler(
            () => true,
            undefined,
            ...listeners
        )
        const eogHandler = eogEventHandler(...listeners)
        const handlers = rsDialogHandler(
            (resignState: ResignState | RSToOffer) => {
                state.resignState = resignState
            },
            (result: SGResult, eog: EOGStatus) => {
                eogHandler.onEndOfBGGame(bgState, result, eog)
            }
        )
        const { bgListener, rsDialogHandler: resignEventHandler } =
            operateWithRS(bgState, rs, handlers)
        const bgEventHandler = bgHandler.addListener(bgListener)
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...bgEventHandler,
            ...resignEventHandler,
        }
        render(<CubefulGame {...cbProps} />)

        // await for first autoOp operation
        await BoardOp.clickLeftDice()

        // await for response to the operation
        setTimeout(() => {
            expect(state.resignState.tag).toBe('RSNone')
            expect(bgState.cbState.tag).toBe('CBEoG')
        }, 0)
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
