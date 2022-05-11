import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBAction, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
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
    cbState: CBState
    sgState: SGState
    cpState?: CheckerPlayState

    cbConfs?: CubefulGameConfs
    onDouble?:(cbState:CBAction)=>void
    dialog?: JSX.Element
} & Partial<
        SingleGameListeners &
        RollListener &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
        cbState,
        sgState,
        dialog,
        cbConfs = { sgConfs: {} },
        onDouble = ()=>{
            //
        },
        ...listeners
    } = props

    const autoRoll: boolean =
        // Takeの直後は自動的にロール
        cbState.tag === 'CBToRoll' && cbState.lastAction === 'Take'
            ? true
            : // Actionできる場合は自動ロールなし
            cbState.tag === 'CBAction'
            ? false
            : // それ以外は設定値次第
              cbConfs.sgConfs.autoRoll??false

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
        ...props,
        ...listeners,
        cube: cbState.cubeState,
        onClickCube,
        sgConfs,
        dialog,
    }

    return <SingleGameBoard {...sgProps} />
}
