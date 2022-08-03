import { BoardStateNode } from 'tsgammon-core'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { collectNodes } from 'tsgammon-core/utils/collectNodes'
import {
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../../components/operators/autoOperators'

export function setRedAutoOp(engine: GammonEngine) {
    return { cb: redCBAutoOperator(engine), sg: redSGAutoOperator(engine) }
}
export function setWhiteAutoOp(engine: GammonEngine) {
    return { cb: whiteCBAutoOperator(engine), sg: whiteSGAutoOperator(engine) }
}

export function noDoubleEngine(): GammonEngine {
    return {
        initialized: () => {
            //
        },
        cubeAction: () => ({
            isDouble: false,
        }),
        cubeResponse: () => ({ isTake: false }),
        checkerPlay: (boardStateNode: BoardStateNode) => {
            const nodes = collectNodes(boardStateNode)
            return nodes[0]
        },
        endOfGame: () => {
            //
        },
    }
}
