import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameConf, standardConf } from 'tsgammon-core'
import { MatchState } from 'tsgammon-core/MatchState'
import { BGState } from 'tsgammon-core/states/BGState'
import { CheckerPlayState } from 'tsgammon-core/states/CheckerPlayState'
import { CBState } from 'tsgammon-core/states/CubeGameState'
import { defaultBGState } from 'tsgammon-core/states/defaultStates'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { setBGStateListener } from '../../components/dispatchers/BGEventHandler'
import {
    BGEventHandlersExtensible,
    buildBGEventHandler,
} from '../../components/dispatchers/buildBGEventHandler'
import {
    CheckerPlayListeners,
    setCPStateListener,
} from '../../components/dispatchers/CheckerPlayDispatcher'
import { rollListener } from '../../components/dispatchers/RollDispatcher'
import { singleGameDispatcher } from '../../components/dispatchers/SingleGameDispatcher'
import { matchStateListener } from '../../components/useMatchState'

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
    clickCube: async () => {
        const cube = screen.getByTestId(/^cube/)
        userEvent.click(cube)
    },
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
    const addOn = matchStateListener(
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
    const sgDispatcher = singleGameDispatcher(gameConf.transitions)
    const handlers = buildBGEventHandler(
        sgDispatcher,
        () => isCrawford,
        rollListener({ diceSource }),
        setBGStateListener(
            defaultBGState(gameConf),
            (next: BGState = state.bgState) => {
                state.bgState.cbState = next.cbState
                state.bgState.sgState = next.sgState
            }
        )
    ).addListener(addOn)

    return {
        ...cpListeners,
        ...handlers,
        diceSource,
    }
}
