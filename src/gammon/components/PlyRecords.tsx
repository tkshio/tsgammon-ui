import React, {ChangeEvent, createRef, useEffect, useState} from 'react'
import {MoveFormatDirection} from "../models/AbsoluteMove";
import {score, Score} from "../models/Score";
import {formatPly, PlyRecord} from "../models/PlyRecord";

import "./plyRecords.css"

export type PlyRecordsProps = {
    plyRecords: PlyRecord[]
    matchScore: Score
    selected?: number
    dispatcher: (i: number) => void
}
const defaultDirection = MoveFormatDirection.ABSOLUTE_INV
const optionalDirection = MoveFormatDirection.RELATIVE_DEC

/**
 * 指し手をテーブルで表示する。更新時には常に末尾が映るよう自動スクロールし、
 * 各指し手のクリックに対してイベント処理を行う
 * @param props 指し手およびdispatcher
 * @param props.plyRecords 指し手を格納した配列
 * @param props.matchScore 現在のスコア
 * @param props.selected 現在選択されている指し手、undefinedの場合は最新
 * @param props.dispatcher 指し手欄がクリックされたときのdispatcher
 * @constructor
 */
export function PlyRecords(props: PlyRecordsProps) {
    const {
        plyRecords = [],
        matchScore = score(),
        selected,
        dispatcher = () => {
        }
    } = {...props}

    // 座標表記のコントロール
    const [direction, setDirection] = useState(defaultDirection)
    // フォーカスの自動移動
    const ref = createRef<HTMLDivElement>()
    useEffect(() => {
        ref?.current?.scrollIntoView({behavior: "smooth", block: "nearest"})
    })

    function switchDirection(event: ChangeEvent<HTMLInputElement>) {
        setDirection(
            event.target.checked ? defaultDirection : optionalDirection
        )
    }

    return (
        <div id={"recordsAndConf"}>
            <div id={"directionCheckbox"}>
                <input type={"checkbox"} checked={(direction === defaultDirection)}
                       onChange={switchDirection}/>
            </div>
            <div id={"scrollPane"}>
                <table className={"records"}>
                    <caption>
                        {`Red: ${matchScore.redScore} White:${matchScore.whiteScore}`}
                    </caption>
                    <colgroup>
                        <col id={"numCol"}/>
                        <col id={"pieceCol"}/>
                        <col id={"movesCol"}/>
                    </colgroup>
                    <tbody>
                    {plyRecords.map((plyRecord, index) => {
                        const piecemark = (plyRecord.type === "Commit") ? (
                            (plyRecord.isRed() ? "pieceMark red" : "")
                            + (plyRecord.isWhite() ? "pieceMark white" : "")) : ""

                        function genRef(index: number) {
                            return (index === (selected ?? (plyRecords.length - 1))) ?
                                {ref: ref} : {}
                        }

                        return (
                            <tr className={"record" + ((index === selected) ? " selected" : "")} key={index}
                                onClick={() => dispatcher(index)}>
                                <td>
                                    <div {...genRef(index)}>{index + 1}
                                    </div>
                                </td>
                                <td>
                                    <div className={piecemark}/>
                                </td>
                                <td>{formatPly(plyRecord, direction, true, "Cannot Move")}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}