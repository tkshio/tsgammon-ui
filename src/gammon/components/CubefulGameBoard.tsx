import {
    BGEventHandlers,
    asSGEventHandlers,
} from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { BoardEventHandlers, BoardProps } from './boards/Board'
import {
    SingleGameBoard,
    SingleGameBoardProps,
} from './SingleGameBoard'

export type CubefulGameBoardProps = {
    bgState: BGState
    cpState?: CheckerPlayState

} & Partial<Pick<BoardProps, 'dialog' | 'upperButton' | 'lowerButton'>> &
    Partial<
        Omit<BGEventHandlers, 'onTake' | 'onPass'> &
            CheckerPlayListeners &
            BoardEventHandlers
    >
export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
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
    const sgHandlers: SingleGameEventHandlers = asSGEventHandlers(
        cbState,
        handlers
    )

    const sgProps: SingleGameBoardProps = {
        sgState,
        cpState,
        cube: cbState.cubeState,
        dialog,
        lowerButton,
        upperButton,
        ...handlers,
        ...sgHandlers,
        onClickCube,
    }

    return <SingleGameBoard {...sgProps} />
}
