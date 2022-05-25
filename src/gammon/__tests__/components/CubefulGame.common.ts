import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameConf, standardConf } from 'tsgammon-core'
import {
    CheckerPlayListeners,
    setCPStateListener
} from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { BGState } from '../../components/BGState'
import { defaultBGState } from '../../components/defaultStates'
import { BGEventHandlers } from '../../components/eventHandlers/BGEventHandlers'
import { cubefulGameEventHandlers } from '../../components/eventHandlers/cubefulGameEventHandlers'
import { MatchState } from '../../components/MatchState'
import { matchStateAddOn } from '../../components/useMatchStateForCubeGame'

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
        matchState: MatchState
        cpState?: CheckerPlayState
        bgState:BGState,
    },
    diceSource: DiceSource,
    isCrawford = false,
    gameConf: GameConf = standardConf
): CheckerPlayListeners &
    BGEventHandlers & {
        diceSource: DiceSource
    } {
    const addOn = matchStateAddOn(
        state.matchState,
        (matchState: MatchState) => {
            state.matchState = matchState
        }
    )

    const cpListeners: CheckerPlayListeners = setCPStateListener(
        (next: CheckerPlayState | undefined) => {
            state.cpState = next
        }
    )
    const { handlers } = cubefulGameEventHandlers(
        isCrawford,
        defaultBGState(gameConf),
        (next: SGState = state.bgState.sgState) => {
            state.bgState.sgState = next
        },
        (next: CBState = state.bgState.cbState) => {
            state.bgState.cbState = next
        },
        rollListeners({ isRollHandlerEnabled: false, diceSource }),
        addOn
    )

    return {
        ...cpListeners,
        ...handlers,
        diceSource,
    }
}
