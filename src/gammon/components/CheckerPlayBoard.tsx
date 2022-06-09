import { useState } from 'react'
import { CubeState } from 'tsgammon-core/CubeState'
import { Dice } from 'tsgammon-core/Dices'
import {
    checkerPlayDispatcher,
    CheckerPlayDispatcher,
    CheckerPlayListeners,
    fill,
} from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import {
    Board,
    BoardEventHandlers,
    BoardProps,
    decorate as decorateBEHandlers,
    DiceLayout,
    layoutCube,
} from './boards/Board'
import { IconButton } from './uiparts/IconButton'
import { RevertButton } from './uiparts/RevertButton'

export type CheckerPlayBoardProps = {
    cpState: CheckerPlayState
    diceLayout: (dices: Dice[]) => DiceLayout
    cube?: CubeState
    upperButton?: JSX.Element
    lowerButton?: JSX.Element
} & Partial<CheckerPlayListeners & BoardEventHandlers>

export function CheckerPlayBoard(props: CheckerPlayBoardProps) {
    const [redoState, setRedoState] = useState<CheckerPlayState | undefined>()
    const { cpState } = props
    const cpListeners = fill(props)

    const dispatcher: CheckerPlayDispatcher = checkerPlayDispatcher(cpListeners)

    const { cube, diceLayout, onClickCube, upperButton, lowerButton } = props
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
        ...layoutCube(cube),

        onClickDice,
        onClickPoint,
        onClickCube,
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
        ) : <IconButton />,
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
