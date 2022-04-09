import { useCallback } from 'react'
import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { CubeState } from 'tsgammon-core/CubeState'
import { dice, Dice } from 'tsgammon-core/Dices'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CheckerPlayListeners } from '../dispatchers/CheckerPlayDispatcher'
import {
    asCheckerPlayState,
    CheckerPlayState,
    CheckerPlayStateCommitted,
} from '../dispatchers/CheckerPlayState'
import {
    RollListener,
    rollListeners,
    singleGameDispatcherWithRD,
} from '../dispatchers/RollDispatcher'
import {
    singleGameDispatcher,
    SingleGameListeners,
} from '../dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from '../dispatchers/SingleGameState'
import {
    Board,
    BoardEventHandlers,
    decorate,
    DiceLayout,
    layoutCube,
} from './boards/Board'
import { blankDice, BlankDice, blankDices } from './boards/Dice'
import { CheckerPlayBoard, CheckerPlayBoardProps } from './CheckerPlayBoard'
import { useDelayedTrigger } from './utils/useDelayedTrigger'

export type SingleGameConfs = {
    autoRoll?: boolean
    diceSource?: DiceSource
    isRollHandlerEnabled?: boolean
    autoOperator?: SGOperator
}

export type SGOperator = {
    operateCheckerPlayRed: (
        doCommitCheckerPlay: (nextNode: BoardStateNode) => void,
        curBoardState: BoardStateNode,
        cubeState?: CubeState
    ) => boolean
    operateCheckerPlayWhite: (
        doCommitCheckerPlay: (nextNode: BoardStateNode) => void,
        curBoardState: BoardStateNode,
        cubeState?: CubeState
    ) => boolean
    operateRollRed: (doRoll: () => void) => boolean
    operateRollWhite: (doRoll: () => void) => boolean
}

export type SingleGameBoardProps = {
    sgState: SGState
    cpState?: CheckerPlayState
    cube?: CubeState
    sgConfs?: SingleGameConfs
} & Partial<
    SingleGameListeners &
        CheckerPlayListeners &
        RollListener &
        BoardEventHandlers
>

export function SingleGameBoard(props: SingleGameBoardProps) {
    const {
        sgState,
        cpState,
        sgConfs = {},
        onRollRequest = () => {
            //
        },
        cube,
        ...sgListeners
    } = props

    const {
        autoRoll = false,
        diceSource = randomDiceSource,
        isRollHandlerEnabled = false,
        autoOperator,
    } = sgConfs

    const rollHandler = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })
    const dispatcher = singleGameDispatcherWithRD(sgListeners, rollHandler)
    const doRoll = useCallback(() => {
        if (sgState.tag === 'SGToRoll') {
            if (autoRoll) {
                dispatcher.doRoll(sgState)
            } else if (autoOperator) {
                const operation =
                    autoOperator[
                        sgState.isRed ? 'operateRollRed' : 'operateRollWhite'
                    ]
                const doRoll = () => dispatcher.doRoll(sgState)
                return operation(doRoll)
            }
        } else if (sgState.tag === 'SGInPlay') {
            if (autoOperator) {
                const operation =
                    autoOperator[
                        sgState.isRed
                            ? 'operateCheckerPlayRed'
                            : 'operateCheckerPlayWhite'
                    ]
                const doCheckerPlay = (node: BoardStateNode) =>
                    dispatcher.doCommitCheckerPlay(sgState, node)

                return operation(doCheckerPlay, sgState.boardStateNode, cube)
            }
        }
        return false
    }, [sgState, autoRoll, autoOperator, dispatcher, cube])

    useDelayedTrigger(doRoll, 10)

    if (sgState.tag !== 'SGInPlay') {
        const { onClickDice } = decorate(props, {
            onClickDice() {
                if (sgState.tag === 'SGOpening') {
                    dispatcher.doOpeningRoll(sgState)
                } else if (sgState.tag === 'SGToRoll') {
                    dispatcher.doRoll(sgState)
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
    } else {
        // チェッカープレイ中の操作は専用のコンポーネントに任せる
        const dispatcher = singleGameDispatcher(props)

        const cpProps: CheckerPlayBoardProps = {
            ...props,
            cpState: cpState ?? asCheckerPlayState(sgState),
            diceLayout: selectDiceLayout(sgState),

            // チェッカープレイが確定した時に通知を受ける
            onCommitCheckerPlay: (cpState: CheckerPlayStateCommitted) => {
                dispatcher.doCommitCheckerPlay(sgState, cpState.boardStateNode)
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
