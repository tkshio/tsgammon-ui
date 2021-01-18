import React, {useState} from 'react';
import {GameState, GammonMessage, Ply, stateBuilder} from "../models/GameState"
import {BoardAction, BoardActionType} from "../models/BoardAction";
import {Board} from "./Board";
import {DiceProps} from "./Dice";
import {whiteSideBoardOperator} from "../models/GameOperators";
import {CubeResponseDialog} from "./CubeResponseDialog";
import {RevertButton} from "./RevertButton";
import {Dialog} from "./Dialog";
import {DispatchOperator, gameStatus} from "../models/GameStatus";
import {CubeOwner} from "../models/CubeState";
import {Dices, formatDices} from "../models/Dices";
import {Score, score} from "../models/Score";
import {formatMoves, MoveFormatDirection} from "../models/AbsoluteMove";
import {EOGStatus} from "../models/BoardState";

import "./gameBoard.css";

type GameBoardProps = {
    boardOperator: (action: BoardAction) => DispatchOperator<GammonMessage>,
    gameState: GameState,
    matchScore: Score,
    dispatcher: (message: GammonMessage[]) => void
}

/**
 * 1ゲームの開始から終了までの基本的な機能を提供する
 * @param props
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.gameState ゲームの現在の状況
 * @param props.matchScore スコアの現在値
 * @param props.dispatcher GammonMessageを受け付けるdispatcher
 *
 * @constructor
 */
export function GameBoard(props: GameBoardProps) {
    const {
        boardOperator = whiteSideBoardOperator(),
        gameState = stateBuilder.initGameState(),
        matchScore = score(),
        dispatcher = (_: GammonMessage[]) => {
        }
    } = {...props}

    const [revertDicesFlag, setRevertDicesFlag] = useState(false)

    // GameStateと直接関係しない操作の処理
    const gammonMsgDispatcher: (_: GammonMessage[]) => void = (msgs: GammonMessage[]) => {

        const checkedMsgs = msgs.map(msg => {
            if (msg.type === "Roll" || msg.type === "Revert") {
                // ロールした時、戻したときは入れ替えを解除する
                setRevertDicesFlag(false)
            }
            return msg
        })

        dispatcher(checkedMsgs)
    }

    // Boardコンポーネントからの操作の処理を定義
    function boardActionDispatcher(action: BoardAction) {
        console.debug("ACTION: ", action.type)
        const actionDispatcher = boardOperator(action);
        const msg = gameState.status.accept(actionDispatcher);
        gammonMsgDispatcher([msg])


        // 駒を動かせるときにはロールの入れ替えができる
        if ((gameState.status === gameStatus.checkerPlayRed ||
            gameState.status === gameStatus.checkerPlayWhite)
            && action.type === BoardActionType.Dice) {
            setRevertDicesFlag(prev => !prev)
        }
    }

    // キューブレスポンスのためのダイアログの出力
    const cubeResponseDialog =
        (gameState.status === gameStatus.cubeResponseRed ||
            gameState.status === gameStatus.cubeResponseWhite
        ) ? (<CubeResponseDialog dispatcher={gammonMsgDispatcher}/>) : undefined

    // 駒の移動中はアンドゥが使える
    const revertButton = gameState.hasMoved() ?
        (<RevertButton dispatcher={gammonMsgDispatcher}/>) : undefined

    // 終了時のダイアログ
    const endOfGameDialog = buildEOGDialog(gameState, matchScore, gammonMsgDispatcher);

    const boardProps = {
        ...buildBoardProps(gameState, revertDicesFlag),
        revertButton: revertButton,
        dispatcher: boardActionDispatcher
    }

    return (
        <div>
            <div className={"boardContainer"}>
                <Board {...boardProps}/>
                <div id={"plyAsText"}>
                    <div className={"curPly"}>&#8203;{renderPlyAsText(gameState.curPlay)}</div>
                    <div className={"lastPly"}>Last play: {renderPlyAsText(gameState.prevPlay)}</div>
                    <div className={"score"}>Red: {matchScore.redScore} - White: {matchScore.whiteScore}</div>
                </div>
                <div id={"ply"}>
                    <div className={"curPly"}>{renderPly(gameState.curPlay)}</div>
                    <div className={"lastPly"}>{renderPly(gameState.prevPlay)}</div>
                    <div className={"score"}>
                        <span className={"playerName red"}>Red</span>
                        <span className={"score red"}>{matchScore.redScore}</span>
                        <span className={"playerName white"}>White</span>
                        <span className={"score white"}>{matchScore.whiteScore}</span>
                    </div>
                </div>
                {cubeResponseDialog}
                {endOfGameDialog}
            </div>
        </div>
    );


    function renderPlyAsText(ply: Ply): string {
        return formatPlyInfo(ply, MoveFormatDirection.ABSOLUTE_INV);

        function formatPlyInfo(plyInfo: Ply, direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC) {
            if (plyInfo.dices.length === 0) {
                return ""
            }
            const roll = formatDices(plyInfo.dices)
            const moves = formatMoves(plyInfo.moves, direction).join(" ")

            return `Roll ${roll} Moves ${moves}`
        }
    }

    function renderPly(ply: Ply) {
        return (
            <>
                <div className={"absolute"}>
                    <span className={"dices"}>{formatDices(ply.dices)}</span>
                    <span
                        className={"move"}>{formatMoves(ply.moves, MoveFormatDirection.ABSOLUTE_INV).join(" ")}</span>
                </div>
                <div className={"relative"}>
                    <span className={"dices"}>{formatDices(ply.dices)}</span>
                    <span
                        className={"move"}>{formatMoves(ply.moves, MoveFormatDirection.RELATIVE_DEC).join(" ")}</span>
                </div>
            </>
        )
    }
}


function buildEOGDialog(gameState: GameState, score: Score, dispatcher: (msgs: GammonMessage[]) => void) {
    if (gameState.status === gameStatus.endOfGame) {

        const msgs = [
            formatStake(gameState.stake, gameState.eogStatus()),
            formatScore(score.add(gameState.stake))
        ]
        return (
            <Dialog msgs={msgs} actionOnClick={() => dispatcher([{type: "Restart"}])}/>
        )
    }
    return ""

    function formatStake(stake: Score, eog: EOGStatus) {
        const gammon = eog.isBackgammon ? " by Backgammon" :
            eog.isGammon ? " by Gammon" : ""

        const red = format("Red", stake.redScore, gammon)
        const white = format("White", stake.whiteScore, gammon)
        return red + white

        function format(player: string, score: number, gammon: string) {
            return score === 0 ? "" : `${player} wins ${score} pt.${gammon}`
        }
    }

    function formatScore(score: Score) {
        return `Score: Red:${score.redScore} - White:${score.whiteScore}`
    }
}

// 盤面情報をBoardコンポーネントのインターフェースに合わせる
function buildBoardProps(gameState: GameState, revertDiceFlag: boolean) {

    const [redDices, whiteDices] = function (): DiceProps[] {
        // 入れ替えが可能で、入れ替えが指定されているときだけ入れ替える
        const orderedDices = function (): Dices {
            const dices = gameState.dices() ?? [];

            if (revertDiceFlag &&
                dices.length === 2 &&
                !dices[0].used &&
                !dices[1].used) {
                return [dices[1], dices[0]]
            }
            return dices
        }()

        const [split, whiteSide, redSide] = function () {
            const dice: DiceProps = {
                dices: orderedDices
            }
            const empty: DiceProps = {dices: []}

            return [() => (dice.dices.length === 2) ?
                [{dices: [dice.dices[0]]}, {dices: [dice.dices[1]]}]
                : [empty, empty],
                () => [empty, dice],
                () => [dice, empty]
            ]
        }()

        return gameState.status.accept({
            initialized: split,
            rollOpening: split,
            endOfGame: () => [],

            cubeActionWhite: whiteSide,
            cubeResponseRed: whiteSide,
            rollDiceWhite: whiteSide,
            rollDiceRed: redSide,

            checkerPlayWhite: whiteSide,
            commitCheckerPlayWhite: whiteSide,

            cubeActionRed: redSide,
            checkerPlayRed: redSide,
            cubeResponseWhite: redSide,
            commitCheckerPlayRed: redSide
        });
    }()

    const [centerCube, redCube, whiteCube] = function () {
        const cube = {cube: gameState.cube};
        const cubeOwner = gameState.cube?.owner;

        if (cubeOwner === undefined) {
            return [cube, undefined, undefined]
        }
        switch (cubeOwner) {
            case CubeOwner.WHITE:
                return [undefined, undefined, cube]
            case CubeOwner.RED:
                return [undefined, cube, undefined]
        }
    }();

    return {
        status: gameState.status.toString(),
        board: gameState.absoluteBoard(),
        redDices: redDices,
        whiteDices: whiteDices,

        centerCube: centerCube,
        redCube: redCube,
        whiteCube: whiteCube,
    }
}

