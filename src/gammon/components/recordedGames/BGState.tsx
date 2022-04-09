import { CBState } from '../../dispatchers/CubeGameState'
import { SGState } from '../../dispatchers/SingleGameState'
import {
    GameState,
    toCBState,
    toSGState,
} from '../../dispatchers/utils/GameState'

export type BGState = {
    cbState: CBState
    sgState: SGState
}

export function toState(gameState: GameState = {}): BGState {
    const cbState: CBState = toCBState(gameState)
    const sgState: SGState = toSGState(gameState)
    return { cbState, sgState }
}
