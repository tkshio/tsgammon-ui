import {
    BGEventHandlers,
    asSGEventHandlers,
} from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { BoardEventHandlers } from './boards/Board'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
} from './SingleGameBoard'

export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
}

export type CubefulGameBoardProps = {
    bgState: BGState
    cpState?: CheckerPlayState

    cbConfs?: CubefulGameConfs
    dialog?: JSX.Element
    onResign?: () => void
} & Partial<
    Omit<BGEventHandlers, 'onTake' | 'onPass'> &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
        bgState,
        cpState,
        dialog,
        cbConfs = { sgConfs: {} },
        onDouble,
        ...handlers
    } = props
    const { cbState, sgState } = bgState
    const autoRoll: boolean = mayAutoRoll(cbState, cbConfs.sgConfs.autoRoll)

    const sgConfs: SingleGameConfs = {
        ...cbConfs.sgConfs,
        autoRoll,
    }

    // キューブでのダブル
    const onClickCube = () => {
        if (cbState.tag === 'CBAction') {
            onDouble?.({ cbState, sgState })
        }
    }
    const sgHandlers: SingleGameEventHandlers = asSGEventHandlers(
        cbState,
        handlers
    )
    const sgProps: SingleGameBoardProps = {
        sgState,
        cpState,
        cube: cbState.cubeState,
        sgConfs,
        dialog,
        ...handlers,
        ...sgHandlers,
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
