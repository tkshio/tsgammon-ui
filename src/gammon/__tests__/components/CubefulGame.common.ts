import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    CheckerPlayListeners,
    setCPStateListener
} from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { cubefulGameEventHandlers } from '../../components/apps/MoneyGame'
import {
    CubeGameEventHandlers,
    SingleGameEventHandlers
} from '../../components/EventHandlers'

export const BoardOp = {
    clickPoint: (pos: number) => {
        const point = screen.getByTestId(new RegExp(`^point-${pos}`))
        userEvent.click(point)
    },
    clickRightDice: () => {
        const rightDice = screen.getByTestId(/^dice-right/)
        userEvent.click(rightDice)
    },
    clickLeftDice: () => {
        const rightDice = screen.getByTestId(/^dice-left/)
        userEvent.click(rightDice)
    },
}

export function isRed(sgState: SGState): boolean {
    if (sgState.tag === 'SGOpening') {
        return false
    }
    return sgState.isRed
}

export function isWhite(sgState: SGState): boolean {
    if (sgState.tag === 'SGOpening') {
        return false
    }
    return !sgState.isRed
}

export function setupEventHandlers(
    state: {
        cpState?: CheckerPlayState
        sgState: SGState
        cbState: CBState
    },
    diceSource: DiceSource
): CheckerPlayListeners &
    SingleGameEventHandlers &
    CubeGameEventHandlers & {
        diceSource: DiceSource
    } {
    const cpListeners: CheckerPlayListeners = setCPStateListener(
        (next: CheckerPlayState | undefined) => {
            state.cpState = next
        }
    )
    const handlers = cubefulGameEventHandlers(
        state.cbState,
        (next: SGState = state.sgState) => {
            state.sgState = next
        },
        (next: CBState = state.cbState) => {
            state.cbState = next
        },
        rollListeners({ isRollHandlerEnabled: false, diceSource })
    ).handlers

    return {
        ...cpListeners,
        ...handlers,
        diceSource,
    }
}
