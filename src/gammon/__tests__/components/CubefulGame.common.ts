import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameConf, standardConf } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { BGEventHandlersExtensible, buildBGEventHandler } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import {
    CheckerPlayListeners,
    setCPStateListener
} from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import { rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { MatchState } from 'tsgammon-core/MatchState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { matchStateAddOn } from '../../components/useMatchState'

export const BoardOp = {
    clickPoint: (pos: number) => {
        const point = screen.getByTestId(new RegExp(`^point-${pos}`))
        userEvent.click(point)
    },
    clickRightDice: async () => {
        const rightDice = screen.getByTestId(/^dice-right/)
        userEvent.click(rightDice)
    },
    clickLeftDice: async () => {
        const rightDice = screen.getByTestId(/^dice-left/)
        userEvent.click(rightDice)
    },
    clickCube:async()=>{
        const cube = screen.getByTestId(/^cube/)
        userEvent.click(cube)
    }
}

export function isRed(state: SGState | CBState): boolean {
    if (
        state.tag === 'SGOpening' ||
        state.tag === 'SGEoG' ||
        state.tag === 'CBOpening' ||
        state.tag === 'CBEoG'
    ) {
        return false
    }
    return state.isRed
}

export function isWhite(state: SGState | CBState): boolean {
    if (
        state.tag === 'SGOpening' ||
        state.tag === 'SGEoG' ||
        state.tag === 'CBOpening' ||
        state.tag === 'CBEoG'
    ) {
        return false
    }
    return !state.isRed
}

export function setupEventHandlers(
    state: {
        matchState: MatchState
        cpState?: CheckerPlayState
        bgState: BGState
    },
    diceSource: DiceSource,
    isCrawford = false,
    gameConf: GameConf = standardConf
): CheckerPlayListeners &
    BGEventHandlersExtensible & {
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
    const handlers = buildBGEventHandler(
        isCrawford,
        rollListeners({ isRollHandlerEnabled: false, diceSource }),
        setBGStateListener(
            defaultBGState(gameConf),
            (next: BGState = state.bgState) => {
                state.bgState.cbState = next.cbState
                state.bgState.sgState = next.sgState
            }
        ),
    ).addListeners(addOn)

    return {
        ...cpListeners,
        ...handlers,
        diceSource,
    }
}
