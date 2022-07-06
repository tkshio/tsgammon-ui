import { render } from '@testing-library/react'
import {
    ResignOffer,
    ResignState,
    rsNone,
} from 'tsgammon-core/dispatchers/ResignState'

import { unmountComponentAtNode } from 'react-dom'
import { EOGStatus } from 'tsgammon-core'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { setCBStateListener } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/dispatchers/MatchState'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameStatus } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { CubefulGame } from '../../../components/CubefulGame'
import {
    bothRSAutoOperator,
    redRSAutoOperator,
    whiteRSAutoOperator,
} from '../../../components/operators/RSAutoOperators'
import {
    resignEventHandlers,
    ResignEventHandlers,
} from '../../../components/ResignEventHandlers'
import { RSToOffer } from '../../../components/uiparts/ResignDialog'
import { w } from '../../../components/withRSAutoOperator'
import { BoardOp } from '../CubefulGame.common'
import { alwaysAccept, alwaysOffer } from './Resign.common'

let container: HTMLElement | null = null
const state: { resignState: ResignState | RSToOffer } = {
    resignState: rsNone(),
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    state.resignState = rsNone()
})

const handlers: ResignEventHandlers = resignEventHandlers(
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
        const setCBState = (cbState: CBState) => {
            bgState.cbState = cbState
        }
        const setSGState = (sgState: SGState) => {
            bgState.sgState = sgState
        }
        const rs = redRSAutoOperator({
            offerAction: alwaysOffer(ResignOffer.Single),
            offerResponse: alwaysAccept,
        })

        const _bgHandlers = cubefulGameEventHandlers(
            true,
            undefined,
            setCBStateListener(bgState.cbState, setCBState),
            setSGStateListener(bgState.sgState, setSGState)
        )
        const bgHandlers = w(rs, bgState, handlers).concat(_bgHandlers)
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...bgHandlers,
        }
        render(<CubefulGame {...cbProps} />)
        await BoardOp.clickRightDice()
        expect(state.resignState.tag).toBe('RSOffered')
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
        const setCBState = (cbState: CBState) => {
            bgState.cbState = cbState
        }
        const setSGState = (sgState: SGState) => {
            bgState.sgState = sgState
        }
        const rs = whiteRSAutoOperator({
            offerAction: alwaysOffer(ResignOffer.Single),
            offerResponse: alwaysAccept,
        })

        const _bgHandlers = cubefulGameEventHandlers(
            true,
            undefined,
            setCBStateListener(bgState.cbState, setCBState),
            setSGStateListener(bgState.sgState, setSGState)
        )
        const bgHandlers = w(rs, bgState, handlers).concat(_bgHandlers)
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...bgHandlers,
        }
        render(<CubefulGame {...cbProps} />)
        await BoardOp.clickLeftDice()

        expect(state.resignState.tag === 'RSOffered').toBeTruthy()
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

        const setCBState = (cbState: CBState) => {
            bgState.cbState = cbState
        }
        const setSGState = (sgState: SGState) => {
            bgState.sgState = sgState
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

        const _bgHandlers = cubefulGameEventHandlers(
            true,
            undefined,
            setCBStateListener(bgState.cbState, setCBState),
            setSGStateListener(bgState.sgState, setSGState)
        )

        const rsHandlers = resignEventHandlers(
            (resignState: ResignState | RSToOffer) => {
                state.resignState = resignState
            },
            (result: SGResult, eog: EOGStatus) => {
                _bgHandlers.onEndGame(bgState, result, eog)
            }
        )
        const bgHandlers = w(rs, bgState, rsHandlers).concat(_bgHandlers)
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...bgHandlers,
        }
        render(<CubefulGame {...cbProps} />)

        // await for first autoOp operation
        await BoardOp.clickLeftDice()

        // await for response to the operation
        setTimeout(() => {
            expect(
                (() => {
                    return true
                })() && state.resignState.tag
            ).toBe('RSNone')
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
