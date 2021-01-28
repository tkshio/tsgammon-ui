import {plyRecord, PlyRecord} from "../models/PlyRecord";
import {GameState, GammonMessage} from "../models/GameState";
import {useState} from "react";
import {gameStatus} from "../models/GameStatus";
import {Score} from "../models/Score";

/**
 * マッチ全体の記録。
 * scoreBeforeとcurPlyRecordsは現在進行中の対戦についての情報を示す
 * curScoreは対戦が終局状態になり、次の対局を開始するまでの間のみ、
 * scoreBeforeと異なる値（対局結果により加点した値）を取る
 */
export type MatchRecord = {
    records: GameRecord[]
    scoreBefore: Score;
    curPlyRecords: PlyRecord[]
    curScore: Score
}

/**
 * 1ゲーム分、すなわちオープニングロールからベアリングオフが終わるまでの記録
 */
export type GameRecord = {
    scoreBefore: Score
    plyRecords: PlyRecord[]
    stake: Score
}

export type MatchState = {
    matchRecord: MatchRecord
    gameState: GameState
}
/**
 * useMatchRecordsが返す変数・関数を型にまとめた定義
 */
export type MatchRecordHookItems = {
    matchState: MatchState,
    reduceState: (state: MatchState, ...messages: GammonMessage[]) => MatchState,
    setGameState: (state: (GameState | ((prev: GameState) => GameState))) => void,
    resumeMatchState: (i: number) => MatchState
}

/**
 * MatchRecordとGameStateの対を管理するHook
 *
 * 対局状態の変化、指し手の追加によってゲームの進行と同時に記録も更新される。
 * また、commitCurPlyRecordsにより、curPlyRecordsにある終局した状態の対局が
 * recordsに転記される。
 */
export function useMatchState(initialGameState: GameState, initialMatchRecord: MatchRecord): MatchRecordHookItems {
    const [matchRecord, setMatchRecord] = useState(initialMatchRecord)
    const [gameState, setGameState] = useState(initialGameState)

    function reduceState(state: MatchState, ...messages: GammonMessage[]): MatchState {
        const matchStateReducer = (state: MatchState, message: GammonMessage) => {
            const [nextState, isEoG, plys] = reduceForPly(state.gameState, message)

            function calcNextRecords(prev: MatchRecord): MatchRecord {
                const curPlysAdded = plys ?
                    {...prev, curPlyRecords: prev.curPlyRecords.concat(plys)} :
                    prev

                return isEoG ?
                    {...curPlysAdded, curScore: prev.curScore.add(nextState.stake)} :
                    curPlysAdded
            }

            let nextRecords = calcNextRecords(state.matchRecord)
            if (message.type === "Restart") {
                nextRecords = commitCurPlyRecords(nextRecords)
            }
            return {gameState: nextState, matchRecord: nextRecords}
        }

        const nextState = messages.reduce(matchStateReducer, state)
        setGameState(nextState.gameState)
        setMatchRecord(nextState.matchRecord)

        return nextState
    }

    function resumeMatchState(i: number): MatchState {
        if (i < 0 || matchRecord.curPlyRecords.length <= i) {
            return {matchRecord: matchRecord, gameState: gameState}
        }
        const revert: GammonMessage = {type: "Revert"}
        // matchRecordにはコミット時の状態で保持されているので、アンドゥで戻しておく
        const resumedState = {
            matchRecord: {...matchRecord, curPlyRecords: matchRecord.curPlyRecords.slice(0, i)},
            gameState: matchRecord.curPlyRecords[i].state.reduce(revert)

        }
        setGameState(resumedState.gameState)
        setMatchRecord(resumedState.matchRecord)
        return resumedState
    }

    return {
        matchState: {gameState: gameState, matchRecord: matchRecord},
        reduceState: reduceState,
        setGameState: setGameState,
        resumeMatchState: resumeMatchState
    }
}

function commitCurPlyRecords(prev: MatchRecord): MatchRecord {
    // Restartにより、現在の棋譜をマッチ記録に転写するとともに、このコンポーネントからはクリアする

    const plyRecords = prev.curPlyRecords
    if (plyRecords.length > 0) {
        const lastPlyRecord = plyRecords[plyRecords.length - 1]
        const lastMatchRecord = {
            stake: lastPlyRecord.state.stake,// stateがEoGの時だけ、0でない値が入る
            scoreBefore: prev.scoreBefore,
            plyRecords: plyRecords
        }

        return {
            records: prev.records.concat(lastMatchRecord),
            scoreBefore: prev.curScore,
            curPlyRecords: [],
            curScore: prev.curScore
        }
    }
    return prev
}


/**
 * ある局面に対してGammonMessageを適用した結果、指し手（Ply）が確定するか、
 * また終局したかどうかを返す。指し手は通常一つだが、終局時のみ二つ（最終手、
 * 終局を示すPly）が返る
 *
 * @param state 現局面
 * @param message stateに適用するメッセージ
 *
 * @return 適用後の局面、終局フラグ（trueなら終局）、確定した指し手
 */
export function reduceForPly(state: GameState, message: GammonMessage):
    [GameState, boolean, PlyRecord[]?] {
    const nextState = state.reduce(message)
    if (nextState !== state) {
        const detected = detectPlyRecord(state, message)
        if (detected.hasValue) {
            const isEoG = (nextState.status === gameStatus.endOfGame);
            const plys: PlyRecord[] = isEoG ?
                [detected.ply, plyRecord("EOG", nextState)] :
                [detected.ply]

            return [nextState, isEoG, plys]
        }
    }
    return [nextState, false];

    function detectPlyRecord(state: GameState, message: GammonMessage): { hasValue: true, ply: PlyRecord } | { hasValue: false } {
        const msgType = message.type
        return (msgType === "Commit" ||
            msgType === "Double" ||
            msgType === "Take" ||
            msgType === "Pass") ? {hasValue: true, ply: plyRecord(msgType, state)} : {hasValue: false}
    }
}

