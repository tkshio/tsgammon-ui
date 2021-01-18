import React, {useEffect, useState} from 'react'
import {GameState, GammonMessage, stateBuilder} from "../models/GameState";
import {GameBoard} from "./GameBoard";
import {AutoOperator, BoardOperator, whiteSideAutoOperator, whiteSideBoardOperator} from "../models/GameOperators";
import {Score, score} from "../models/Score";

export type GameProps = {
    initialState: GameState
    initialScore: Score
    boardOperator: BoardOperator,
    autoOperator: AutoOperator
}

/**
 * スコア累計の機能のみを持つ、ゲームをプレイさせるコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function Game(props: GameProps) {
    const {
        boardOperator = whiteSideBoardOperator(),
        autoOperator = whiteSideAutoOperator(),
        initialState = stateBuilder.initGameState(),
        initialScore = score(),
    } = {...props}

    const [matchScore, gameState, dispatcher] = useScore(initialScore, initialState)

    // 相手方の操作、ダイスロールなど、レンダリング後に自律的に行うアクションの駆動
    useEffect(() => {
            gameState.status.accept(autoOperator(gameState, dispatcher));
        }
    )


    const gameBoardProps = {
        boardOperator: boardOperator,
        gameState: gameState,
        matchScore: matchScore,
        dispatcher: dispatcher
    };

    return (
        <>
            <GameBoard {...gameBoardProps}/>
        </>
    )
}

// ゲームが終了状態になるたびにスコアを加算するHook。最新のスコアしか持たないので、
// useMatchRecordsより簡略化されている
function useScore(initialScore: Score, initialState: GameState): [Score, GameState, (msg: GammonMessage[]) => void] {
    const [matchScore, setMatchScore] = useState(initialScore)
    const [gameState, setGameState] = useState(initialState);

    const dispatcher = (messages: GammonMessage[]) => {
        setGameState(prev => {
            return messages.reduce((state, message) => {
                const reducedState = state.reduce(message)
                console.log("MSG:", message.type, " -> ", reducedState.status.toString())
                if (reducedState.eogStatus().isEndOfGame) {
                    setMatchScore(prev => prev.add(reducedState.stake))
                }
                return reducedState;
            }, prev)
        })
    }

    return [matchScore, gameState, dispatcher]
}
