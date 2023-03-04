import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AbsoluteBoardState, Dice, GameConf, standardConf } from 'tsgammon-core'
import { MatchState } from 'tsgammon-core/MatchState'
import { BGState } from 'tsgammon-core/states/BGState'
import { CBState } from 'tsgammon-core/states/CubeGameState'
import { defaultBGState } from 'tsgammon-core/states/defaultStates'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { BlankDice } from '../../components/boards/Dice'
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
import { CheckerPlayState } from '../../components/states/CheckerPlayState'
import { matchStateListener } from '../../components/useMatchState'

export const BoardOp = {
    clickPoint: async (pos: number) => {
        const point = screen.getByTestId(new RegExp(`^point-${pos}`))
        userEvent.click(point)
    },
    clickRightDice: async () => {
        const dice = screen.getByTestId(/^dice-right/)
        userEvent.click(dice)
    },
    clickLeftDice: async () => {
        const dice = screen.getByTestId(/^dice-left/)
        userEvent.click(dice)
    },
    clickCube: async () => {
        const cube = screen.getByTestId(/^cube/)
        userEvent.click(cube)
    },
    clickRevertButton: async () => {
        const revert = screen.getByTestId(/^revert-button/)
        userEvent.click(revert)
    },
    selectPlyRecord: async (num: number) => {
        const targetRed = screen.getByTestId(`plyrecord${num}`)
        userEvent.click(targetRed)
    },
    clickGoBackButton: async () => {
        const resumeButtonRed = screen.getByText('Go back')
        userEvent.click(resumeButtonRed)
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
    const sgDispatcher = singleGameDispatcher(gameConf.transition)
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

export function assertAbsBoardPositions(
    aBoard: AbsoluteBoardState,
    pos: number[]
) {
    aBoard.points().forEach((num, index) => expect(num).toBe(pos[index]))
}
export function assertPositions(pos: number[]) {
    pos.forEach((v, index) => {
        // eslint-disable-next-line testing-library/no-node-access
        const pieces = screen.getByTestId(`point-${index}`).firstElementChild
        if (v > 0) {
            expect(pieces?.className).toBe('point white')
            expect(pieces?.childNodes.length).toBe(v)
        } else if (v < 0) {
            expect(pieces?.className).toBe('point red')
            expect(pieces?.childNodes.length).toBe(-v)
        } else {
            expect(pieces?.childNodes.length).toBe(0)
        }
    })
}

export function assertNoDices(side: 'right' | 'left') {
    const dice = screen.getByTestId(`dice-${side}`)
    // eslint-disable-next-line testing-library/no-node-access
    expect(dice.firstElementChild?.className).toBe('dice')
    // eslint-disable-next-line testing-library/no-node-access
    expect(dice.firstElementChild?.firstElementChild).toBeNull()
}

export function assertDices(
    dices: (Dice | BlankDice)[],
    side: 'right' | 'left'
) {
    dices.forEach((dice, idx) => {
        const diceParentNode = screen.getByTestId(
            `dice-${side}`
            // eslint-disable-next-line testing-library/no-node-access
        )?.firstElementChild
        expect(diceParentNode?.className).toBe('dice')
        // eslint-disable-next-line testing-library/no-node-access
        expect(diceParentNode?.children.item(idx)?.className).toBe(
            `pip d${dice.pip + (dice.used ? ' used' : '')}`
        )
    })
}
