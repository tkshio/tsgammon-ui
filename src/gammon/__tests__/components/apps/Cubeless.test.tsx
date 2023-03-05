import { render } from '@testing-library/react'
import { act } from '@testing-library/react-hooks'
import { dice } from 'tsgammon-core'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { Cubeless, CubelessProps } from '../../../components/apps/Cubeless'
import { assertDices, assertNoDices, BoardOp } from '../CubefulGame.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})
describe('Cubeless', () => {
    test('records plays and supports undo/redo', async () => {
        const diceSource = presetDiceSource(1, 3, 4, 2)
        const props: () => CubelessProps = () => ({
            diceSource,
            recordMatch: true,
        })

        const { rerender } = render(<Cubeless {...props()} />)

        // do Roll
        await act(async () => {
            BoardOp.clickRightDice()
        })
        rerender(<Cubeless {...props()} />)
        await act(async () => {
            BoardOp.clickPoint(20)
        })
        rerender(<Cubeless {...props()} />)
        assertDices([dice(1, true), dice(3, true)], 'right')
        // commit and record
        await act(async () => {
            BoardOp.clickRightDice()
        })
        rerender(<Cubeless {...props()} />)

        // Red rolls
        await act(async () => {
            BoardOp.clickLeftDice()
        })
        rerender(<Cubeless {...props()} />)
        assertDices([dice(4), dice(2)], 'left')

        // back to last state
        await act(async () => {
            BoardOp.selectPlyRecord(0)
        })
        rerender(<Cubeless {...props()} />)
        assertDices([dice(1, true), dice(3, true)], 'right')

        // revert to beginning of last state
        await act(async () => {
            BoardOp.clickRevertButton()
        })
        rerender(<Cubeless {...props()} />)
        assertDices([dice(1), dice(3)], 'right')

        // resume to latest
        await act(async () => {
            BoardOp.clickLatestRecord()
        })
        rerender(<Cubeless {...props()} />)
        assertDices([dice(4), dice(2)], 'left')
        assertNoDices('right')
    })
})
