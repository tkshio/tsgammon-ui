import { ChangeEvent, createRef, useEffect, useState } from 'react'
import { PlyRecordEoG } from 'tsgammon-core/records/PlyRecord'
import { PlyStateRecord } from 'tsgammon-core/records/PlyStateRecord'
import { formatPlyRecord } from 'tsgammon-core/records/utils/formatPlyRecord'
import { score, Score } from 'tsgammon-core/Score'
import { MoveFormatDirection } from 'tsgammon-core/utils/formatAbsMove'
import { PlayersConf } from '../uiparts/PlayersConf'

import './plyRecords.css'

export type PlyRecordsProps<T> = {
    plyRecords: PlyStateRecord<T>[]
    eogRecord?: PlyRecordEoG
    matchScore: Score
    playersConf:PlayersConf
    selected?: number
    dispatcher: (index: number, state?: T) => void
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
export function PlyRecords<T>(props: PlyRecordsProps<T>) {
    const {
        plyRecords: plyStates = [],
        eogRecord,
        matchScore = score(),
        playersConf,
        selected,
        dispatcher = () => {
            //
        },
    } = { ...props }

    // 座標表記のコントロール
    const [direction, setDirection] = useState(defaultDirection)

    // フォーカスの自動移動: refが指定された要素にフォーカスする
    const ref = createRef<HTMLDivElement>()

    // refは、selected番目の要素か、それがなければ最下段の要素
    function genRef(index: number) {
        return index === (selected ?? plyStates.length) ? { ref } : {}
    }

    useEffect(() => {
        if (ref?.current?.scrollIntoView) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    })

    function switchDirection(event: ChangeEvent<HTMLInputElement>) {
        setDirection(
            event.target.checked ? defaultDirection : optionalDirection
        )
    }

    return (
        <div id={'recordsAndConf'}>
            <div id={'directionCheckbox'}>
                <input
                    type={'checkbox'}
                    checked={direction === defaultDirection}
                    onChange={switchDirection}
                />
            </div>
            <div id={'scrollPane'}>
                <table className={'records'}>
                    <caption>
                        {`${playersConf.red.name}: ${matchScore.redScore} ${playersConf.white.name}: ${matchScore.whiteScore}`}
                    </caption>
                    <colgroup>
                        <col id={'numCol'} />
                        <col id={'pieceCol'} />
                        <col id={'movesCol'} />
                    </colgroup>
                    <tbody>
                        {plyStates.map(
                            (plyState: PlyStateRecord<T>, index: number) => {
                                const plyRecord = plyState.plyRecord
                                const piecemark =
                                    plyRecord.tag === 'Commit'
                                        ? (plyRecord.isRed
                                              ? 'pieceMark red'
                                              : '') +
                                          (!plyRecord.isRed
                                              ? 'pieceMark white'
                                              : '')
                                        : ''

                                return (
                                    <tr
                                        className={
                                            'record' +
                                            (index === selected
                                                ? ' selected'
                                                : '')
                                        }
                                        key={index}
                                        onClick={() =>
                                            dispatcher(index, plyState.state)
                                        }
                                    >
                                        <td>
                                            <div {...genRef(index)}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={piecemark} />
                                        </td>
                                        <td>
                                            {formatPlyRecord(
                                                plyRecord,
                                                direction,
                                                true,
                                                'Cannot Move'
                                            )}
                                        </td>
                                    </tr>
                                )
                            }
                        )}
                        <tr
                            className={
                                'record' +
                                (selected === plyStates.length
                                    ? ' selected'
                                    : '')
                            }
                            key={plyStates.length}
                            onClick={() => dispatcher(plyStates.length)}
                        >
                            <td>
                                <div {...genRef(plyStates.length)}>
                                    {plyStates.length + 1}
                                </div>
                            </td>
                            <td>
                                <div />
                            </td>
                            <td>
                                {eogRecord
                                    ? formatPlyRecord(
                                          eogRecord,
                                          direction,
                                          true,
                                          ''
                                      )
                                    : ''}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
