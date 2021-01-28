import {GameConf} from "./GameState";
import {Score} from "./Score";
import {formatPly, PlyRecord} from "./PlyRecord";
import {MoveFormatDirection} from "./AbsoluteMove";
import {MatchRecord} from "../components/UseMatchState";


/**
 * MatchRecordsをテキストに変換、表示する
 * @param matchRecords 対象となるマッチ
 * @param conf オプショナルルールの適否など、ヘッダ情報に出力する設定情報
 * @constructor
 */
export function renderText(matchRecords: MatchRecord, conf?: GameConf): string {
    const date = new Date()
    const digit2 = lPadder(2, "0")
    const eventDate = `${date.getFullYear()}.${digit2("" + (date.getMonth() + 1))}.${digit2("" + date.getDate())}`
    const eventTime = `${digit2("" + date.getHours())}.${digit2("" + date.getMinutes())}`
    const header = `; [Site "tsgammon-ui"]
; [Player 1 "White"]
; [Player 2 "Red"]
; [EventDate "${eventDate}"]
; [EventTime "${eventTime}"]
; [Variation "Backgammon"]
; [Unrated "On"]
; [Jacoby "${conf?.jacobyRule ? "On" : "Off"}"]
; [Beaver "Off"]
; [CubeLimit "${conf?.cubeMax ?? 512}"]

0 point match

`
    const records = mergeCurrentGame(matchRecords)

    function mergeCurrentGame(matchRecords: MatchRecord) {
        const curRecords = matchRecords.curPlyRecords
        if (curRecords.length === 0) {
            return matchRecords.records
        } else {
            return matchRecords.records.concat({
                stake: curRecords[curRecords.length - 1].state.stake,
                scoreBefore: matchRecords.scoreBefore,
                plyRecords: curRecords
            })
        }
    }

    const matchLogs: string = records.map(
        (matchRecord, index) => {
            return renderRecs(matchRecord.scoreBefore,
                matchRecord.plyRecords, index, matchRecord.stake).join('\n')
        }).join("\n\n\n\n")

    return header
        + matchLogs
        + "\n"

    function renderRecs(scoreBefore: Score, plyRecords: PlyRecord[], index: number, stake?: Score,): string[] {
        const columnFmt = rPadder(34)
        const numFmt = lPadder(3)

        const gameDesc = ` Game ${index + 1}`
        const scoreDesc = buildScoreDesc()

        function buildScoreDesc() {
            const fmt38 = rPadder(38)
            const whiteCol = fmt38("White : " + scoreBefore.whiteScore)
            const redCol = `Red : ${scoreBefore.redScore}`
            return ` ${whiteCol}${redCol}`
        }

        const turns = buildTurns(plyRecords)
            .map((turn, index) => {
                const num = numFmt("" + (index + 1))
                const whiteCol = columnFmt(turn.white ? formatPly(turn.white, MoveFormatDirection.RELATIVE_DEC, false, "Cannot Move") : "")
                const redCol = columnFmt(turn.red ? formatPly(turn.red, MoveFormatDirection.RELATIVE_DEC, false, "Cannot Move") : "")
                return `${num}) ${whiteCol}${redCol}`
            })

        const stakes = stake ? buildStakeLine(stake) : ""

        function buildStakeLine(stake: Score): string {
            const whiteStake = formatStake(stake.whiteScore)
            const redStake = formatStake(stake.redScore)
            return (`     ${columnFmt(" " + whiteStake)} ${redStake}`)

            function formatStake(score: number): string {
                return score === 0 ? "" : `Wins ${score} point`
            }
        }

        return [
            gameDesc,
            scoreDesc,
        ].concat(turns, stakes)
    }

    function rPadder(n: number, c?: string): (s: string) => string {
        const padding = (c ?? " ").repeat(n)
        return (s: string) => {
            const padded = s + padding;
            return padded.substr(0, n);
        }
    }

    function lPadder(n: number, c?: string): (s: string) => string {
        const padding = (c ?? " ").repeat(n)
        return (s: string) => {
            const padded = padding + s;
            return padded.substr(padded.length - n, n);
        }
    }
}

type Turn = {
    white?: PlyRecord, red?: PlyRecord
}

function buildTurns(recs: PlyRecord[]): Turn[] {
    return recs.map((plyRecord, index, records) => {
            if (plyRecord.isRed()) {
                // 赤のPlyについて、白→赤の順でまとめてTurnとする
                const prev = (index > 0) ? records[index - 1] : undefined
                if (prev && prev.isWhite()) {
                    return {white: prev, red: plyRecord}
                }
                // 赤先行なので、直前の項目が存在しない場合
                return {undefined, red: plyRecord}

            } else if (index === records.length - 1) {
                if (plyRecord.type === "EOG") {
                    // 完了したゲームで、最後が白の手番で終わっている場合、赤のPlyでの出力がないので補完
                    const prev = (index > 0) ? records[index - 1] : undefined
                    if (prev && prev.isWhite()) {
                        return {white: prev, red: undefined}
                    }
                    // prevは存在しないか、isRedなので出力済
                } else if (plyRecord.isWhite()) {
                    // ゲームが進行中で、白で終わっている
                    return {white: plyRecord, red: undefined}
                }
            }
            return undefined
        }
    ).filter(hasValue)

    function hasValue<T>(item: T | undefined): item is T {
        return item !== undefined;
    }
}
