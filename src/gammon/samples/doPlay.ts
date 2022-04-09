import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { SingleGameDispatcher } from '../dispatchers/SingleGameDispatcher'
import { SGState } from '../dispatchers/SingleGameState'

const diceSource = randomDiceSource

export function doPlay(
    engine: GammonEngine,
    sgState: SGState,
    sgDispatcher: SingleGameDispatcher
) {
    switch (sgState.tag) {
        case 'SGOpening': {
            const openingRoll = diceSource.roll()
            sgDispatcher.doOpeningRoll(sgState, openingRoll)
            break
        }
        case 'SGInPlay': {
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)
            sgDispatcher.doCommitCheckerPlay(sgState, nextNode)
            break
        }
        case 'SGToRoll': {
            const roll = diceSource.roll()
            sgDispatcher.doRoll(sgState, roll)
            break
        }
        case 'SGEoG':
            break
    }
}
