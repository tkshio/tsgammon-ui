import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    GameSetup,
    toCBState,
    toSGState,
} from 'tsgammon-core/dispatchers/utils/GameSetup'

export type BGState = {
    cbState: CBState
    sgState: SGState
}

export function toState(gameState: GameSetup = {}): BGState {
    const cbState: CBState = toCBState(gameState)
    const sgState: SGState = toSGState(gameState)
    return { cbState, sgState }
}
