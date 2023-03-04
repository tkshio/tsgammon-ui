import { useState } from 'react'
import { Dice } from 'tsgammon-core/Dices'
import {
    Board,
    BoardEventHandlers,
    BoardProps,
    decorate as decorateBEHandlers,
    DiceLayout,
} from './boards/Board'
import { CubeProps } from './boards/Cube'
import { layoutCube } from './boards/utils/layoutCube'
import {
    checkerPlayDispatcher,
    CheckerPlayDispatcher,
    CheckerPlayListeners,
    fill,
} from './dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from './states/CheckerPlayState'
import { IconButton } from './uiparts/IconButton'
import { RevertButton } from './uiparts/RevertButton'

export type CheckerPlayBoardProps = {
    cpState: CheckerPlayState
    diceLayout: (dices: Dice[]) => DiceLayout
    cubeProps?: CubeProps
    dialog?: JSX.Element
    upperButton?: JSX.Element
    lowerButton?: JSX.Element
} & Partial<CheckerPlayListeners & BoardEventHandlers>

export function CheckerPlayBoard(props: CheckerPlayBoardProps) {
    const [redoState, setRedoState] = useState<CheckerPlayState | undefined>()
    const { cpState } = props
    const cpListeners = fill(props)

    const dispatcher: CheckerPlayDispatcher = checkerPlayDispatcher(cpListeners)

    const {
        cubeProps,
        diceLayout,
        onClickCube,
        dialog,
        upperButton,
        lowerButton,
    } = props
    const { onClickDice, onClickPoint } = decorateBEHandlers(
        { onClickDice: doClickDice, onClickPoint: doClickPoint },
        props
    )

    const boardProps: BoardProps = {
        board: cpState.absBoard,
        ...diceLayout(cpState.curBoardState.dices),
        ...layoutCube(cubeProps),

        onClickDice,
        onClickPoint,
        onClickCube,
        dialog,
        centerButton: cpState.isUndoable ? (
            <RevertButton
                onClick={() => {
                    dispatcher.doUndo(cpState)
                    setRedoState(cpState)
                }}
            />
        ) : redoState ? (
            <RevertButton
                mode="redo"
                onClick={() => {
                    dispatcher.doRedo(redoState)
                    setRedoState(undefined)
                }}
            />
        ) : (
            <IconButton />
        ),
        upperButton,
        lowerButton,
    }

    return <Board {...boardProps} />

    function doClickDice() {
        if (cpState.curBoardState.isCommitable) {
            dispatcher.doCommitCheckerPlay(cpState)
        } else {
            dispatcher.doRevertDices(cpState)
        }
    }
    function doClickPoint(absPos: number, _: Dice[]) {
        dispatcher.doCheckerPlay(cpState, absPos)
    }
}
