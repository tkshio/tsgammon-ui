import { BGState } from 'tsgammon-core/states/BGState'
import { BoardEventHandlers, BoardProps } from './boards/Board'
import { CubeProps } from './boards/Cube'
import { asSGEventHandler, BGEventHandler } from './dispatchers/BGEventHandler'
import { CheckerPlayListeners } from './dispatchers/CheckerPlayDispatcher'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { CheckerPlayState } from './states/CheckerPlayState'

export type CubefulGameBoardProps = {
    cubeProps?: CubeProps
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
