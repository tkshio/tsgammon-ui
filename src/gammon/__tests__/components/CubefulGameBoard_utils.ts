import { ComponentProps } from "react"
import { DiceSource } from "tsgammon-core/utils/DiceSource"
import { CubefulGameBoard } from "../../components/CubefulGameBoard"
import { CheckerPlayListeners, setCPStateListener  } from "../../dispatchers/CheckerPlayDispatcher"
import { CheckerPlayState } from "../../dispatchers/CheckerPlayState"
import { CubeGameListeners, setCBStateListener  } from "../../dispatchers/CubeGameDispatcher"
import { CBState } from "../../dispatchers/CubeGameState"
import { SingleGameListeners, setSGStateListener  } from "../../dispatchers/SingleGameDispatcher"
import { SGState } from "../../dispatchers/SingleGameState"


export function isRed(sgState: SGState): boolean {
    if (sgState.tag === 'SGOpening') {
        return false
    }
    return sgState.isRed
}
export function isWhite(sgState: SGState): boolean {
    if (sgState.tag === 'SGOpening') {
        return false
    }
    return !sgState.isRed
}

export function setupListeners(
    state: {
        cpState?: CheckerPlayState
        sgState: SGState
        cbState: CBState
    },
    diceSource: DiceSource
): ComponentProps<typeof CubefulGameBoard> {
    const cpListeners: CheckerPlayListeners = setCPStateListener(
        (next: CheckerPlayState | undefined) => {
            state.cpState = next
        }
    )
    const sgListeners: SingleGameListeners = setSGStateListener(
        (next: SGState) => {
            state.sgState = next
        }
    )
    const cbListeners: CubeGameListeners = setCBStateListener(
        (next: CBState) => {
            state.cbState = next
        }
    )

    return {
        ...state,
        ...cbListeners,
        ...sgListeners,
        ...cpListeners,
        cbConfs: {
            sgConfs: {
                diceSource,
            },
        },
    }
}
