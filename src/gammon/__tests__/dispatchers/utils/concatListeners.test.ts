import { concatBGListeners } from '../../../components/dispatchers/BGEventHandler'
import { BGListener } from '../../../components/dispatchers/BGListener'
import { concatSGListeners } from '../../../components/dispatchers/buildSGEventHandler'
import { SingleGameListener } from '../../../components/dispatchers/SingleGameListener'

const doNothing = () => {
    //
}
describe('concatBG', () => {
    test('concats all members', () => {
        const bg: BGListener = {
            onBGGameStarted: doNothing,
            onBGOpeningRerolled: doNothing,
            onAwaitCubeAction: doNothing,
            onCubeActionStarted: doNothing,
            onCubeActionSkipped: doNothing,
            onDoubled: doNothing,
            onDoubleAccepted: doNothing,
            onPassed: doNothing,
            onAwaitCheckerPlay: doNothing,
            onCommitted: doNothing,
            onEndOfBGGame: doNothing,
        }
        const keys: (keyof BGListener)[] = Object.getOwnPropertyNames(
            bg
        ) as (keyof BGListener)[]

        const bar = concatBGListeners(bg, bg)
        keys.forEach((key) => {
            expect(bar[key]).toBeDefined()
        })
    })
})

describe('concatSG', () => {
    test('concats all members', () => {
        const sg: SingleGameListener = {
            onAwaitRoll: doNothing,
            onCheckerPlayCommitted: doNothing,
            onCheckerPlayStarted: doNothing,
            onEndOfGame: doNothing,
            onGameStarted: doNothing,
            onOpeningCheckerPlayStarted: doNothing,
            onRerollOpening: doNothing,
        }
        const keys: (keyof SingleGameListener)[] = Object.getOwnPropertyNames(
            sg
        ) as (keyof SingleGameListener)[]

        const bar = concatSGListeners(sg, sg)
        keys.forEach((key) => {
            expect(bar[key]).toBeDefined()
        })
    })
})
