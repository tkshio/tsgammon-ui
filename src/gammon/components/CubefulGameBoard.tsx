import {
    BGEventHandler,
    asSGEventHandler,
} from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { BoardEventHandlers, BoardProps } from './boards/Board'
import { CubeProps } from './boards/Cube'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'

export type CubefulGameBoardProps = {
    cubeProps?:CubeProps
    bgState: BGState
    cpState?: CheckerPlayState
} & Partial<Pick<BoardProps, 'dialog' | 'upperButton' | 'lowerButton'>> &
    Partial<
        Omit<BGEventHandler, 'onTake' | 'onPass'> &
            CheckerPlayListeners &
            BoardEventHandlers
    >
export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
        cubeProps,
        bgState,
        cpState,
        dialog,
        lowerButton,
        upperButton,
        onDouble,
        ...handlers
    } = props
    const { cbState, sgState } = bgState

    // キューブでのダブル
    const onClickCube = () => {
        if (cbState.tag === 'CBAction' && sgState.tag === 'SGToRoll') {
            onDouble?.({ cbState, sgState })
        }
    }
    const sgHandlers = asSGEventHandler(cbState, handlers)

    const sgProps: SingleGameBoardProps = {
        sgState,
        cpState,
        cubeProps,
        dialog,
        lowerButton,
        upperButton,
        ...handlers,
        ...sgHandlers,
        onClickCube,
    }

    return <SingleGameBoard {...sgProps} />
}
