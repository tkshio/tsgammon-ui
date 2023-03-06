import { render } from '@testing-library/react'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulMatch, CubefulMatchProps } from '../../apps/CubefulMatch'
import { runUndoRedoTest } from './Cubeless.test'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})
describe('CubefulMatch', () => {
    test('records plays and supports undo/redo', async () => {
        const diceSource = presetDiceSource(1, 3, 4, 2)
        const props: () => CubefulMatchProps = () => ({
            diceSource,
            recordMatch: true,
        })

        const { rerender } = render(<CubefulMatch {...props()} />)
        await runUndoRedoTest(() => rerender(<CubefulMatch {...props()} />))
    })
})
