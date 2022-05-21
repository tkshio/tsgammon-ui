import { Fragment, useCallback } from 'react'
import { CubeState } from 'tsgammon-core/CubeState'
import { dice, Dice } from 'tsgammon-core/Dices'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    asCheckerPlayState,
    CheckerPlayState,
    CheckerPlayStateCommitted
} from 'tsgammon-core/dispatchers/CheckerPlayState'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState'
import {
    Board,
    BoardEventHandlers,
    decorate,
    DiceLayout,
    layoutCube
} from './boards/Board'
import { blankDice, BlankDice, blankDices } from './boards/Dice'
import { CheckerPlayBoard, CheckerPlayBoardProps } from './CheckerPlayBoard'
import { SingleGameEventHandlers } from './eventHandlers/SingleGameEventHandlers'
import { PositionID } from './uiparts/PositionID'
import { useDelayedTrigger } from './utils/useDelayedTrigger'


export type SingleGameConfs = {
    showPositionID?: boolean
    autoRoll?: boolean
}

export type SingleGameBoardProps = {
    sgState: SGState
    cpState?: CheckerPlayState
    cube?: CubeState
    sgConfs?: SingleGameConfs
    dialog?: JSX.Element
} & Partial<SingleGameEventHandlers & CheckerPlayListeners & BoardEventHandlers>

function useAutoRoll(
    sgState: SGState,
    autoRoll: boolean,
    onRoll: (sgState: SGToRoll) => void
) {
    const doRoll = useCallback(() => {
        if (sgState.tag === 'SGToRoll') {
            if (autoRoll) {
                onRoll(sgState)
            }
        }
        return false
    }, [sgState, autoRoll, onRoll])
    useDelayedTrigger(doRoll, 10)
}
export function SingleGameBoard(props: SingleGameBoardProps) {
    const doNothing = () => {
        //
    }
    const {
        sgState,
        cpState,
        sgConfs = {},
        cube,
        onCommit = doNothing,
        onRoll = doNothing,
        onRollOpening = doNothing,
    } = props
    const { showPositionID = true, autoRoll = false } = sgConfs
    useAutoRoll(sgState, autoRoll, onRoll)
    //    useSGAutoOperator(sgState, autoRoll, autoOperator, dispatcher, cube)

    const positionID = showPositionID && (
        <PositionID points={sgState.boardState.points} />
    )

    const board =
        sgState.tag === 'SGInPlay'
            ? renderBoardInPlay(sgState)
            : renderBoard(sgState)

    return (
        <Fragment>
            {positionID}
            {board}
        </Fragment>
    )

    function renderBoard(sgState: SGOpening | SGToRoll | SGEoG) {
        const { onClickDice } = decorate(props, {
            onClickDice() {
                if (sgState.tag === 'SGOpening') {
                    onRollOpening(sgState)
                } else if (sgState.tag === 'SGToRoll') {
                    onRoll(sgState)
                }
            },
        })
        const boardProps = {
            ...props,
            board: sgState.absBoard,
            ...layoutDices(sgState),
            ...layoutCube(cube),
            onClickDice,
        }
        return <Board {...boardProps} />
    }

    function renderBoardInPlay(sgState: SGInPlay) {
        // チェッカープレイ中の操作は専用のコンポーネントに任せる
        const cpProps: CheckerPlayBoardProps = {
            ...props,
            cpState: cpState ?? asCheckerPlayState(sgState),
            diceLayout: selectDiceLayout(sgState),

            // チェッカープレイが確定した時に通知を受ける
            onCommitCheckerPlay: (cpState: CheckerPlayStateCommitted) => {
                onCommit(sgState, cpState.boardStateNode)
                if (props.onCommitCheckerPlay) {
                    props.onCommitCheckerPlay(cpState)
                }
            },
        }
        return <CheckerPlayBoard {...cpProps} />
    }
}
// InPlay時以外は、SGStateから直接表示するダイスのレイアウトも内容も決まる
function layoutDices(sgState: SGOpening | SGToRoll | SGEoG): DiceLayout {
    switch (sgState.tag) {
        case 'SGOpening': {
            const dices: Dice[] | BlankDice[] = sgState.dicePip
                ? [dice(sgState.dicePip)]
                : [blankDice]
            return { redDices: { dices }, whiteDices: { dices } }
        }
        case 'SGToRoll':
            return selectDiceLayout(sgState)(blankDices)
        case 'SGEoG':
            return selectDiceLayout(sgState)(sgState.dices)
    }
}

// InPlay時は、ダイスはチェッカープレイに応じて変わるので、
// 関数だけ返して動的にレイアウトする
function selectDiceLayout(sgState: SGToRoll | SGEoG | SGInPlay) {
    return sgState.isRed ? layoutDicesAsRed : layoutDicesAsWhite
}

function layoutDicesAsRed(dices: Dice[] | BlankDice[]): DiceLayout {
    return { redDices: { dices }, whiteDices: { dices: [] } }
}

function layoutDicesAsWhite(dices: Dice[] | BlankDice[]): DiceLayout {
    return { redDices: { dices: [] }, whiteDices: { dices } }
}
