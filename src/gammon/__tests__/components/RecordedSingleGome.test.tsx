import { render, screen } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react-hooks'
import { assert } from 'console'
import { dice, score, standardConf } from 'tsgammon-core'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { GameStatus, toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { useSGRecorder } from '../../components/apps/useSGRecorder'
import { blankDice } from '../../components/boards/Dice'
import { buildSGEventHandler } from '../../components/dispatchers/buildSGEventHandler'
import { rollListener } from '../../components/dispatchers/RollDispatcher'
import {
    setSGStateListener,
    singleGameDispatcher,
} from '../../components/dispatchers/SingleGameDispatcher'
import {
    RecordedSingleGame,
    RecordedSingleGameProps,
} from '../../components/recordedGames/RecordedSingleGame'
import {
    assertDices,
    assertNoDices,
    assertPositions,
    BoardOp,
    isRed,
    isWhite,
} from './CubefulGame.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

describe('RecordedSingleGame', () => {
    const initialState = toSGState({
        gameStatus: GameStatus.TOROLL_WHITE,
        absPos: standardConf.initialPos,
    })
    const g = { sgState: initialState }
    const setSGState = (state: SGState) => (g.sgState = state)

    const { result } = renderHook(() =>
        useSGRecorder(standardConf, setSGState, true, score())
    )
    const diceSource = presetDiceSource(1, 3, 4, 2)
    const props: () => RecordedSingleGameProps = () => ({
        sgState: g.sgState,
        matchRecord: result.current.sgRecorder.matchRecord,
        onResumeState: result.current.sgRecorder.onResumeState,
        ...buildSGEventHandler(
            singleGameDispatcher(standardConf.transition),
            rollListener({ diceSource }),
            setSGStateListener(initialState, setSGState),
            result.current.matchRecordListener
        ),
    })

    test('transits to InPlay state and renders rolled dice', async () => {
        const { rerender } = render(<RecordedSingleGame {...props()} />)
        // do Roll
        await act(async () => {
            BoardOp.clickRightDice()
        })
        rerender(<RecordedSingleGame {...props()} />)
        assertDices([dice(1), dice(3)], 'right')
        assertPositions(standardConf.initialPos)

        // make point
        await act(async () => {
            BoardOp.clickPoint(20)
        })
        rerender(<RecordedSingleGame {...props()} />)

        assertPositions(
            // prettier-ignore
            [0,
            2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
            -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
            0]
        )
        expect(
            result.current.sgRecorder.matchRecord.curGameRecord.plyRecords
                .length
        ).toBe(0)

        // do Commit
        await act(async () => {
            BoardOp.clickRightDice()
        })
        rerender(
            <RecordedSingleGame
                {...{
                    ...props(),
                }}
            />
        )
        expect(isRed(g.sgState)).toBeTruthy()
        assertNoDices('right')
        assertDices([blankDice, blankDice], 'left')

        // select last record
        BoardOp.selectPlyRecord(0)
        rerender(<RecordedSingleGame {...props()} />)
        expect(screen.getByText('Go back').className).toBe('button')

        // go back to recorded state
        BoardOp.clickGoBackButton()
        rerender(<RecordedSingleGame {...props()} />)
        expect(isWhite(g.sgState)).toBeTruthy()
        assertNoDices('left')
        assertDices([dice(1, true), dice(3, true)], 'right')
        assertPositions(
            // prettier-ignore
            [0,
            2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
            -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
            0]
        )

        // do undo
        BoardOp.clickRevertButton()
        rerender(<RecordedSingleGame {...props()} />)
        expect(isWhite(g.sgState)).toBeTruthy()
        assertNoDices('left')
        assertDices([dice(1), dice(3)], 'right')
        assertPositions(
            // prettier-ignore
            [0,
             2, 0, 0, 0, 0,-5, /* bar */ 0,-3, 0, 0, 0, 5,
            -5, 0, 0, 0, 3, 0, /* bar */ 5, 0, 0, 0, 0,-2,
            0]
        )

        // do redo and commit
        BoardOp.clickRevertButton()
        BoardOp.clickRightDice()
        rerender(<RecordedSingleGame {...props()} />)
        expect(isRed(g.sgState)).toBeTruthy()

        // do Red's play
        await act(async () => BoardOp.clickLeftDice())
        rerender(<RecordedSingleGame {...props()} />)
        assertDices([dice(4), dice(2)], 'left')
        BoardOp.clickPoint(4)
        assertPositions(
            // prettier-ignore
            [0,
             2, 0, 0,-2, 0,-4, /* bar */ 0,-2, 0, 0, 0, 5,
            -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
            0]
        )

        // undo red
        assertDices([dice(4, true), dice(2, true)], 'left')
        BoardOp.clickRevertButton()
        assertDices([dice(4), dice(2)], 'left')

        // redo red
        BoardOp.clickRevertButton()
        assertDices([dice(4, true), dice(2, true)], 'left')

        // commit red
        BoardOp.clickLeftDice()
        assert(isWhite(g.sgState))

        rerender(<RecordedSingleGame {...props()} />)

        // select 2nd record
        BoardOp.selectPlyRecord(1)
        rerender(<RecordedSingleGame {...props()} />)
        expect(screen.getByText('Go back').className).toBe('button')

        // go back to recorded state
        BoardOp.clickGoBackButton()

        // resumed
        rerender(<RecordedSingleGame {...props()} />)
        assert(isRed(g.sgState))
        assertDices([dice(4, true), dice(2, true)], 'left')

        assertPositions(
            // prettier-ignore
            [0,
             2, 0, 0,-2, 0,-4, /* bar */ 0,-2, 0, 0, 0, 5,
            -5, 0, 0, 0, 2, 0, /* bar */ 4, 2, 0, 0, 0,-2,
            0]
        )
    })
})
