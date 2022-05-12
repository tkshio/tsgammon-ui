import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBAction, CBResponse, CBState } from 'tsgammon-core/dispatchers/CubeGameState'

import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { BoardEventHandlers } from './boards/Board'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
    SingleGameEventHandlers,
} from './SingleGameBoard'

export type CubeGameEventHandlers = {
    onTake:(cbState:CBResponse)=>void,
    onPass:(cbState:CBResponse)=>void,
    onDoubleOffer: (cbState: CBAction) => void
}
export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
}

export type CubefulGameBoardProps = {
    cbState: CBState
    sgState: SGState
    cpState?: CheckerPlayState

    cbConfs?: CubefulGameConfs
    dialog?: JSX.Element
} & Partial<
    CubeGameEventHandlers &
        SingleGameEventHandlers &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
        cbState,
        sgState,
        cpState,
        dialog,
        cbConfs = { sgConfs: {} },
        onDoubleOffer = () => {
            //
        },
        ...handlers
    } = props

    const autoRoll: boolean = mayAutoRoll(cbState, cbConfs.sgConfs.autoRoll)

    const sgConfs: SingleGameConfs = {
        ...cbConfs.sgConfs,
        autoRoll,
    }

    // キューブでのダブル
    const onClickCube = () => {
        if (cbState.tag === 'CBAction') {
            onDoubleOffer(cbState)
        }
    }

    const sgProps: SingleGameBoardProps = {
        sgState,
        cpState,
        cube: cbState.cubeState,
        onClickCube,
        sgConfs,
        dialog,
        ...handlers,
    }

    return <SingleGameBoard {...sgProps} />
}

function mayAutoRoll(cbState: CBState, fallback = false): boolean {
    return cbState.tag === 'CBToRoll' && cbState.lastAction === 'Take'
        ? // Takeの直後は自動的にロール
          true
        : // Actionできる場合は自動ロールなし
        cbState.tag === 'CBAction'
        ? false
        : // それ以外は設定値次第
          fallback
}
