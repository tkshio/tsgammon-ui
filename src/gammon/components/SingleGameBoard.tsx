import { CubeState } from 'tsgammon-core/CubeState'
import { dice, Dice } from 'tsgammon-core/Dices'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    asCheckerPlayState,
    CheckerPlayState,
    CheckerPlayStateCommitted,
} from 'tsgammon-core/dispatchers/CheckerPlayState'
import { SingleGameEventHandler } from 'tsgammon-core/dispatchers/SingleGameEventHandler'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import {
    Board,
    BoardEventHandlers,
    BoardProps,
    decorate,
    DiceLayout,
    layoutCube,
} from './boards/Board'
import { blankDice, BlankDice, blankDices } from './boards/Dice'
import { CheckerPlayBoard, CheckerPlayBoardProps } from './CheckerPlayBoard'

export type SingleGameBoardProps = {
    sgState: SGState
    cpState?: CheckerPlayState
    cube?: CubeState
} & Partial<Pick<BoardProps, 'dialog' | 'upperButton' | 'lowerButton'>> &
    Partial<SingleGameEventHandler & CheckerPlayListeners & BoardEventHandlers>
export function SingleGameBoard(props: SingleGameBoardProps) {
    const { sgState } = props

    const board =
        sgState.tag === 'SGInPlay'
            ? renderBoardInPlay(props, sgState)
            : renderBoard(props, sgState)

    return board
}
function renderBoard(
    props: SingleGameBoardProps,
    sgState: SGOpening | SGToRoll | SGEoG
) {
    const { onClickDice } = decorate(props, {
        onClickDice() {
            if (sgState.tag === 'SGOpening') {
                props.onRollOpening?.(sgState)
            } else if (sgState.tag === 'SGToRoll') {
                props.onRoll?.(sgState)
            }
        },
    })
    const boardProps = {
        ...props,
        board: sgState.absBoard,
        ...layoutDices(sgState),
        ...layoutCube(props.cube),
        onClickDice,
    }
    return <Board {...boardProps} />
}

function renderBoardInPlay(props: SingleGameBoardProps, sgState: SGInPlay) {
    // チェッカープレイ中の操作は専用のコンポーネントに任せる
    const cpProps: CheckerPlayBoardProps = {
        ...props,
        cpState: props.cpState ?? asCheckerPlayState(sgState),
        diceLayout: selectDiceLayout(sgState),

        // チェッカープレイが確定した時に通知を受ける
        onCommitCheckerPlay: (cpState: CheckerPlayStateCommitted) => {
            props.onCommit?.(sgState.withNode(cpState.boardStateNode))
            props.onCommitCheckerPlay?.(cpState)
        },
    }
    return <CheckerPlayBoard {...cpProps} />
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
function selectDiceLayout(
    sgState: SGToRoll | SGEoG | SGInPlay
): (dices: Dice[] | BlankDice[]) => DiceLayout {
    if (sgState.tag === 'SGEoG' && sgState.result === SGResult.NOGAME) {
        // 中断時はダイスを表示しない
        return () => ({ redDices: { dices: [] }, whiteDices: { dices: [] } })
    } else {
        return sgState.isRed ? layoutDicesAsRed : layoutDicesAsWhite
    }
}

function layoutDicesAsRed(dices: Dice[] | BlankDice[]): DiceLayout {
    return { redDices: { dices }, whiteDices: { dices: [] } }
}

function layoutDicesAsWhite(dices: Dice[] | BlankDice[]): DiceLayout {
    return { redDices: { dices: [] }, whiteDices: { dices } }
}
