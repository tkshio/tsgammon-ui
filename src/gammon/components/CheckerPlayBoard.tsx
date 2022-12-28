import { useState } from 'react'
import { Dice } from 'tsgammon-core/Dices'
import { CheckerPlayState } from 'tsgammon-core/states/CheckerPlayState'
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
        ...layoutDices(
            cpState.curBoardState.dices,
            cpState.revertDicesFlag,
            diceLayout
        ),
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
    function doClickPoint(absPos: number, dices: Dice[]) {
        dispatcher.doCheckerPlay(cpState, absPos, dices)
    }
}

function layoutDices(
    dices: Dice[],
    revertDicesFlag: boolean,
    diceLayout: (dices: Dice[]) => DiceLayout
): DiceLayout {
    const orderedDice = reorderDice(dices, revertDicesFlag)
    return diceLayout(orderedDice)

    // ゾロ目ではなく、どちらのダイスも未使用の時は入れ替えができる
    function reorderDice(dices: Dice[], revertDiceFlag: boolean) {
        return revertDiceFlag &&
            dices.length === 2 &&
            !dices[0].used &&
            !dices[1].used
            ? [dices[1], dices[0]]
            : dices
    }
}
