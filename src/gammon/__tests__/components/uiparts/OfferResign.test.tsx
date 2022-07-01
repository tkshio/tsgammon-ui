import { act, render } from '@testing-library/react'
import {
    ResignOffer,
    ResignState,
    rsNone
} from 'tsgammon-core/dispatchers/ResignState'

import { unmountComponentAtNode } from 'react-dom'
import { EOGStatus } from 'tsgammon-core'
import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/dispatchers/MatchState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameStatus } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { CubefulGame } from '../../../components/CubefulGame'
import {
    bothRSAutoOperator,
    redRSAutoOperator,
    whiteRSAutoOperator
} from '../../../components/operators/RSAutoOperators'
import {
    resignEventHandlers,
    ResignEventHandlers
} from '../../../components/ResignEventHandlers'
import {
    RSToOffer
} from '../../../components/uiparts/ResignDialog'
import {
    addOnWithRSAutoOperator,
    handlersWithRSAutoOperator
} from '../../../components/withRSAutoOperator'
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
        const sgHandlersAddOn = addOnWithRSAutoOperator(
            redRSAutoOperator({
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            }),
            handlers
        )
        const cbHandlers: BGEventHandlers = cubefulGameEventHandlers(
            true,
            bgState,
            setSGState,
            setCBState,
            undefined,
            sgHandlersAddOn
        )
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...cbHandlers,
        }
        render(<CubefulGame {...cbProps} />)
        BoardOp.clickRightDice()

        expect(state.resignState.tag === 'RSOffered').toBeTruthy()
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
        const sgHandlersAddOn = addOnWithRSAutoOperator(
            whiteRSAutoOperator({
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            }),
            handlers
        )
        const cbHandlers: BGEventHandlers = cubefulGameEventHandlers(
            true,
            bgState,
            setSGState,
            setCBState,
            undefined,
            sgHandlersAddOn
        )
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...cbHandlers,
        }
        render(<CubefulGame {...cbProps} />)
        BoardOp.clickLeftDice()

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
                offerResponse: (offer: ResignOffer, doAccept: () => void) => {
                    alwaysAccept(offer, doAccept)
                    return true
                },
            },
            {
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            }
        )
        const rsHandlers = handlersWithRSAutoOperator(
            rs,
            handlers,
            (result: SGResult, eog: EOGStatus) => {
                foo(result, eog)
            },
            bgState.sgState,
            bgState.cbState.cubeState
        )
        const sgHandlersAddOn = addOnWithRSAutoOperator(rs, rsHandlers)

        const cbHandlers: BGEventHandlers = cubefulGameEventHandlers(
            true,
            bgState,
            setSGState,
            setCBState,
            undefined,
            sgHandlersAddOn,
        )
        function foo(result: SGResult, eog: EOGStatus) {
            cbHandlers.onEndGame(bgState, result, eog)
        }
        const cbProps = {
            bgState,
            matchState: matchStateForUnlimitedMatch(),
            ...rsHandlers,
            ...cbHandlers,
        }
        render(<CubefulGame {...cbProps} />)
        act(()=>{BoardOp.clickLeftDice()})

        expect(state.resignState.tag === 'RSNone').toBeTruthy()
        expect(
           bgState.cbState.tag
        ).toBe('CBEoG')
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

