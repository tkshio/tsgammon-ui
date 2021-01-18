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

/**
 * useMatchRecordsが返す変数・関数を型にまとめた定義
 */
export type MatchRecordHookItems = {
    matchRecord: MatchRecord,
    reduceState: (state: GameState, message: GammonMessage) => GameState,
    setPlyRecords: (plyRecords: PlyRecord[]) => void,
    commitCurPlyRecords: () => void
}

/**
 * MatchRecordを管理するHook
 *
 * 対局状態の変化、指し手の追加によって記録が更新される。
 * また、commitCurPlyRecordsにより、curPlyRecordsにある終局した状態の対局が
 * recordsに転記される。
 */
export function useMatchRecords(initialMatchRecords: MatchRecord): MatchRecordHookItems {
    const [matchRecords, setMatchRecords] = useState(initialMatchRecords)

    function reduceState(state: GameState, message: GammonMessage) {
        const [nextState, isEoG, plys] = reduceForPly(state, message)
        setMatchRecords(prev => {
            const curPlysAdded = plys ?
                {...prev, curPlyRecords: prev.curPlyRecords.concat(plys)} :
                prev

            return isEoG ?
                {...curPlysAdded, curScore: prev.curScore.add(nextState.stake)} :
                curPlysAdded
        })
        return nextState
    }

    return {
        matchRecord: matchRecords,
        reduceState: reduceState,
        setPlyRecords: (plyRecords => {
            setMatchRecords(prev => {
                return {...prev, curPlyRecords: plyRecords}
            })
        }),
        commitCurPlyRecords: () => {
            // Restartにより、現在の棋譜をマッチ記録に転写するとともに、このコンポーネントからはクリアする
            setMatchRecords(prev => {

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
            })
        }
    }
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

