import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import {
    CBState} from 'tsgammon-core/dispatchers/CubeGameState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { BoardEventHandlers } from './boards/Board'
import { CubeGameEventHandlers, SingleGameEventHandlers } from './EventHandlers'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
} from './SingleGameBoard'


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
        onDouble = () => {
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
            onDouble(cbState)
        }
    }

    const sgProps: SingleGameBoardProps = {
        sgState,
        cpState,
        cube: cbState.cubeState,
        sgConfs,
        dialog,
        ...handlers,
        onClickCube,
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
