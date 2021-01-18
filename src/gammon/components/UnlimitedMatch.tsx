import React, {useEffect, useState} from 'react'
import {GameState, GammonMessage, stateBuilder} from "../models/GameState";
import {AutoOperator, BoardOperator, whiteSideAutoOperator, whiteSideBoardOperator} from "../models/GameOperators";
import {GameBoard} from "./GameBoard";
import {PlyRecords} from "./PlyRecords";
import {score} from "../models/Score";
import {renderText} from "../models/MatchRecords";
import {MatchRecordsText} from "./MatchRecordsText";
import {MatchRecord, useMatchRecords} from "./UseMatchRecord";

import "./unlimitedMatch.css"
import "./button.css"


export type UnlimitedMatchProps = {
    initialState: GameState
    boardOperator: BoardOperator,
    autoOperator: AutoOperator,
    initialMatchRecord?: MatchRecord
}

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function UnlimitedMatch(props: UnlimitedMatchProps) {
    const {
        initialState = stateBuilder.initGameState(),

        boardOperator = whiteSideBoardOperator(),
        autoOperator = whiteSideAutoOperator(),

        initialMatchRecord = {
            scoreBefore: score(),
            curScore: score(),
            records: [],
            curPlyRecords: []
        }
    } = {...props}

    // ゲームの状態を管理する
    const [gameState, setGameState] = useState(initialState)

    // ゲームの状態の変化に対し、指し手（ply）の記録と
    // ゲームの終了の有無（とそれに伴うスコアの加算）の管理を行う
    const {
        matchRecord,
        reduceState,
        setPlyRecords,
        commitCurPlyRecords
    } = useMatchRecords(initialMatchRecord)

    // 指し手履歴を見ているとき、あとで本来の状態に復帰するために保持する
    const [resumeToState, setResumeToState] = useState(initialState)

    // 最新状態以外の過去の履歴を見ているかどうか。最新状態以外では操作やCPU側の手番を行わない
    const [isLatest, setIsLatest] = useState(true)

    // 指し手履歴の選択位置の管理
    const [selected, setSelected] = useState(0)

    // マッチ記録コピー時、メッセージを一瞬だけ表示させるためのフラグ
    const [runAnimation, setRunAnimation] = useState(false)

    // GammonMessageを下位のコンポーネントから受け取って処理する。
    // 新しい状態を生成すると同時に、そこに復帰できるように記録を更新する
    const dispatcher = (messages: GammonMessage[]) => {
        if (isLatest) {
            setGameState(prev => {
                const nextState = messages.reduce((state, message) => {
                        const reducedState = reduceState(state, message)

                        if (message.type === "Restart") {
                            commitCurPlyRecords()
                        }

                        return reducedState
                    },
                    prev);
                setResumeToState(nextState)
                return nextState
            })
        }
    }

    // 相手方の操作、ダイスロールなど、レンダリング後に自律的に行うアクションの駆動
    useEffect(() => {
        // 相手方ないし自動的に行う操作
        if (isLatest) {
            gameState.status.accept(autoOperator(gameState, dispatcher));
        }
    })

    // CopyMatchLogのメッセージの解除
    useEffect(() => {
            if (runAnimation) {
                setTimeout(() => {
                    setRunAnimation(false)
                }, 500)
            }
        }
    )

    const gameBoardProps = {
        boardOperator: boardOperator,
        gameState: gameState,
        matchScore: matchRecord.scoreBefore,
        dispatcher: dispatcher
    };

    const plyRecordsProps = {
        plyRecords: matchRecord.curPlyRecords,
        matchScore: matchRecord.curScore,
        selected: isLatest ? undefined : selected,
        dispatcher: (index: number) => {
            if (index === matchRecord.curPlyRecords.length - 1) {
                setGameState(resumeToState)
                setIsLatest(true)
            } else {
                setGameState(matchRecord.curPlyRecords[index].state)
                setIsLatest(false)
            }
            setSelected(index)

        }
    }
    const matchRecordsTextProps = {
        matchRecords: matchRecord,
        conf: gameState.conf
    }

    function resumeStatus() {
        if (!isLatest) {
            const revert: GammonMessage = {type: "Revert"}
            // matchRecordにはコミット時の状態で保持されているので、アンドゥで戻しておく
            setGameState(matchRecord.curPlyRecords[selected].state.reduce(revert))
            setPlyRecords(matchRecord.curPlyRecords.slice(0, selected))
            setIsLatest(true)
        }
    }

    function copyMatchRecords() {
        const text = renderText(matchRecord, gameState.conf)
        navigator?.clipboard?.writeText(text).then(() => {
            setRunAnimation(true)
        })
    }

    return (
        <>
            <div id={"main"}>
                <div id={"boardPane"}>
                    <GameBoard {...gameBoardProps}/>
                    <div id={"copy"}>
                        <div id={"copiedMessage"} className={(runAnimation ? "runAnimation" : "disabled")}>
                            copied.
                        </div>
                        <div id={"copyMatchRecords"}
                             className={"button" + ((navigator?.clipboard === undefined) ? " disabled" : "")}
                             onClick={copyMatchRecords}>
                            Copy Records
                        </div>
                    </div>
                    <MatchRecordsText {...matchRecordsTextProps} />
                </div>
                <div id={"recordsPane"}>
                    <div>
                        <div id={"resume"} className={"button" + (isLatest ? " disabled" : "")}
                             onClick={resumeStatus}>Go back
                        </div>
                    </div>
                    <PlyRecords {...plyRecordsProps}/>
                </div>
            </div>
        </>
    )
}