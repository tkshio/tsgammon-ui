import React from 'react'
import {score} from "../models/Score";
import {GameConf} from "../models/GameState";
import {renderText} from "../models/MatchRecords";
import {MatchRecord} from "./UseMatchState";


export type MatchRecordsTextProps = {
    matchRecords: MatchRecord
    conf: GameConf
}

/**
 * MatchRecordsをテキストに変換、表示する
 * @param props マッチの記録
 * @param props.matchRecords 表示するマッチ
 * @param props.conf オプショナルルールの適否など、ヘッダ情報に出力する設定情報
 * @constructor
 */
export function MatchRecordsText(props: MatchRecordsTextProps) {
    const {
        matchRecords = {
            scoreBefore: score(),
            curScore: score(),
            records: [],
            curPlyRecords: []
        },
        conf = undefined
    } = {...props}

    return (
        <>
            <div id={"matchRecord"}>
                <pre>{renderText(matchRecords, conf)}
                </pre>
            </div>
        </>
    )
}


