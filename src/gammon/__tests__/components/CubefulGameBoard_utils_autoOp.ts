import { ComponentProps } from "react"
import { BoardStateNode } from "tsgammon-core"
import { GammonEngine } from "tsgammon-core/engines/GammonEngine"
import { collectNodes } from "tsgammon-core/utils/collectNodes"
import { CubefulGameBoard, CubefulGameConfs, CBOperator } from "../../components/CubefulGameBoard"
import { SGOperator } from "../../components/SingleGameBoard"
import { redSGAutoOperator, redCBAutoOperator, whiteSGAutoOperator, whiteCBAutoOperator } from "../../dispatchers/autoOperators"


export function setRedAutoOp(
    props: ComponentProps<typeof CubefulGameBoard>,
    engine: GammonEngine
): CubefulGameConfs {
    return setAutoOp(
        props,
        redSGAutoOperator(engine),
        redCBAutoOperator(engine)
    )
}
export function setWhiteAutoOp(
    props: ComponentProps<typeof CubefulGameBoard>,
    engine: GammonEngine
): CubefulGameConfs {
    return setAutoOp(
        props,
        whiteSGAutoOperator(engine),
        whiteCBAutoOperator(engine)
    )
}

export function setAutoOp(
    props: ComponentProps<typeof CubefulGameBoard>,
    sgOp: SGOperator,
    cbOp: CBOperator
): CubefulGameConfs {
    return {
        ...props.cbConfs,
        sgConfs: {
            ...props?.cbConfs?.sgConfs,
            autoOperator: sgOp,
        },
        autoOperator: cbOp,
    }
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
