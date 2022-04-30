import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    CubefulGameConfs,
} from '../../components/CubefulGameBoard'
import {
    CheckerPlayListeners,
    setCPStateListener,
} from '../../dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from '../../dispatchers/CheckerPlayState'
import {
    CubeGameListeners,
    setCBStateListener,
} from '../../dispatchers/CubeGameDispatcher'
import { CBState } from '../../dispatchers/CubeGameState'
import {
    setSGStateListener,
    SingleGameListeners,
} from '../../dispatchers/SingleGameDispatcher'
import { SGState } from '../../dispatchers/SingleGameState'

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

export function setupListeners(
    state: {
        cpState?: CheckerPlayState
        sgState: SGState
        cbState: CBState
    },
    diceSource: DiceSource
): CheckerPlayListeners &
    SingleGameListeners &
    CubeGameListeners & { cbConfs: CubefulGameConfs } {
    const cpListeners: CheckerPlayListeners = setCPStateListener(
        (next: CheckerPlayState | undefined) => {
            state.cpState = next
        }
    )
    const sgListeners: SingleGameListeners = setSGStateListener(
        (next: SGState) => {
            state.sgState = next
        }
    )
    const cbListeners: CubeGameListeners = setCBStateListener(
        (next: CBState) => {
            state.cbState = next
        }
    )

    return {
        ...state,
        ...cbListeners,
        ...sgListeners,
        ...cpListeners,
        cbConfs: {
            sgConfs: {
                diceSource,
            },
        },
    }
}
