import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    ResignOffer,
    ResignState,
    rsNone
} from 'tsgammon-core/dispatchers/ResignState'

import { unmountComponentAtNode } from 'react-dom'
import { eog, EOGStatus } from 'tsgammon-core'
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
    redRSAutoOperator,
    whiteRSAutoOperator
} from '../../../components/operators/RSAutoOperators'
import {
    resignEventHandlers,
    ResignEventHandlers
} from '../../../components/ResignEventHandlers'
import {
    ResignDialog,
    ResignDialogProps,
    RSToOffer
} from '../../../components/uiparts/ResignDialog'
import {
    addOnWithRSAutoOperator,
    handlersWithRSAutoOperator
} from '../../../components/withRSAutoOperator'
import { BoardOp } from '../CubefulGame.common'
import { neverOffer, alwaysReject, alwaysAccept, alwaysOffer } from './Resign.common'

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
const props: ResignDialogProps = {
    isGammonSaved: false,
    resignState: state.resignState,
    acceptResign: () => {
        //
    },
    ...handlers,
}
describe('ResignDialog', () => {
    test('provides nothing for default state', async () => {
        expect(ResignDialog(props)).toBe(null)
    })

    test('provides dialog for single/gammon/backgammon(resign from red), accepts single resign', async () => {
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: { tag: 'RSToOffer', isRed: true },
                }}
            />
        )
        expect(screen.getByRole('offer-gammon')).toBeDefined()
        expect(screen.getByRole('offer-backgammon')).toBeDefined()
        const button = screen.getByRole('offer-single')
        expect(button).toBeDefined()
        userEvent.click(button)
        expect(
            state.resignState.tag === 'RSOffered' &&
                !state.resignState.isRed &&
                state.resignState.offer === ResignOffer.Single
        ).toBeTruthy()
    })
    test('provides dialog for single/gammon/backgammon(resign from white), accepts single resign', async () => {
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: { tag: 'RSToOffer', isRed: false },
                }}
            />
        )
        const button = screen.getByRole('offer-single')
        expect(button).toBeDefined()
        userEvent.click(button)
        expect(
            state.resignState.tag === 'RSOffered' &&
                state.resignState.isRed &&
                state.resignState.offer === ResignOffer.Single
        ).toBeTruthy()
    })
    test('accepts gammon resign', async () => {
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: { tag: 'RSToOffer', isRed: false },
                }}
            />
        )
        const button = screen.getByRole('offer-gammon')
        expect(button).toBeDefined()
        userEvent.click(button)
        expect(
            state.resignState.tag === 'RSOffered' &&
                state.resignState.isRed &&
                state.resignState.offer === ResignOffer.Gammon
        ).toBeTruthy()
    })
    test('accepts backgammon resign', async () => {
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: { tag: 'RSToOffer', isRed: false },
                }}
            />
        )
        const button = screen.getByRole('offer-backgammon')
        expect(button).toBeDefined()
        userEvent.click(button)
        expect(
            state.resignState.tag === 'RSOffered' &&
                state.resignState.isRed &&
                state.resignState.offer === ResignOffer.Backgammon
        ).toBeTruthy()
    })
    test('provides dialog for response to the offer, and the rejected offer set into lastOffer property', async () => {
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: rsNone().doOfferResignRed(ResignOffer.Single),
                }}
            />
        )

        const acceptButton = screen.getByRole('accept-resign')
        expect(acceptButton).toBeDefined()
        const rejectButton = screen.getByRole('reject-resign')
        expect(rejectButton).toBeDefined()
        userEvent.click(rejectButton)
        expect(
            state.resignState.tag === 'RSToOffer' &&
                state.resignState.lastOffer === ResignOffer.Single
        ).toBeTruthy()
    })
    test('accepts the offer', async () => {
        const eogState = { result: SGResult.NOGAME, eogStatus: eog() }
        const acceptResign = jest.fn(
            (result: SGResult, eogStatus: EOGStatus) => {
                eogState.result = result
                eogState.eogStatus = eogStatus
            }
        )
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: rsNone().doOfferResignWhite(
                        ResignOffer.Gammon
                    ),
                    acceptResign,
                }}
            />
        )
        const acceptButton = screen.getByRole('accept-resign')
        userEvent.click(acceptButton)
        expect(state.resignState.tag === 'RSNone').toBeTruthy()
        expect(acceptResign).toBeCalled()
        expect(eogState.result).toBe(SGResult.REDWON)
        expect(eogState.eogStatus).toMatchObject({
            isEndOfGame: true,
            isBackgammon: false,
            isGammon: true,
        })
    })

    test('disables rejected offer(single)', async () => {
        // SingleでOfferして一回Rejectされた状態
        const offer = rsNone().doOfferResignWhite(ResignOffer.Single)
        handlers.onRejectResign(offer)
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: state.resignState,
                }}
            />
        )
        expect(screen.queryByRole('offer-single')).not.toBeInTheDocument()
        expect(screen.getByRole('offer-gammon')).toBeInTheDocument()
        expect(screen.getByRole('offer-backgammon')).toBeInTheDocument()
        expect(screen.getByRole('cancel-resign')).toBeInTheDocument()
    })

    test('disables rejected offer(Gammon)', async () => {
        // GammonでOfferして一回Rejectされた状態
        const offer = rsNone().doOfferResignWhite(ResignOffer.Gammon)
        handlers.onRejectResign(offer)
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: state.resignState,
                }}
            />
        )
        expect(screen.queryByRole('offer-single')).not.toBeInTheDocument()
        expect(screen.queryByRole('offer-gammon')).not.toBeInTheDocument()
        expect(screen.getByRole('offer-backgammon')).toBeInTheDocument()
        expect(screen.getByRole('cancel-resign')).toBeInTheDocument()
    })

    test('disables rejected offer(Backgammon)', async () => {
        const offer = rsNone().doOfferResignWhite(ResignOffer.Backgammon)
        handlers.onRejectResign(offer)
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: state.resignState,
                }}
            />
        )
        expect(screen.queryByRole('offer-single')).not.toBeInTheDocument()
        expect(screen.queryByRole('offer-gammon')).not.toBeInTheDocument()
        expect(screen.queryByRole('offer-backgammon')).not.toBeInTheDocument()
        expect(screen.getByRole('cancel-resign')).toBeInTheDocument()
    })
    test('executes auto-operation for resign response(cpu:red)', async () => {
        const rs = redRSAutoOperator({
            offerAction: neverOffer,
            offerResponse: alwaysReject,
        })

        const _handlers = handlersWithRSAutoOperator(
            rs,
            handlers,
            doNothing,
            {} as SGState
        )
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: { tag: 'RSToOffer', isRed: false },
                    ..._handlers,
                }}
            />
        )
        const button = screen.getByRole('offer-single')
        expect(button).toBeDefined()
        userEvent.click(button)
        expect(state.resignState.tag === 'RSToOffer').toBeTruthy()
    })

    test('executes auto-operation for resign response(cpu:white)', async () => {
        const rs = whiteRSAutoOperator({
            offerAction: neverOffer,
            offerResponse: alwaysAccept,
        })

        const _handlers = handlersWithRSAutoOperator(
            rs,
            handlers,
            doNothing,
            {} as SGState
        )
        render(
            <ResignDialog
                {...{
                    ...props,
                    resignState: { tag: 'RSToOffer', isRed: true },
                    ..._handlers,
                }}
            />
        )
        const button = screen.getByRole('offer-single')
        expect(button).toBeDefined()
        userEvent.click(button)
        expect(state.resignState.tag === 'RSNone').toBeTruthy()
    })

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
})

afterEach(() => {
    // clean up DOM
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})

function doNothing() {
    return
}
