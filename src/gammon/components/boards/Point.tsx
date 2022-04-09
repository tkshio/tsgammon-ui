import React from 'react'
import './point.css'

export type PointProps = {
    count: number
}

/**
 * 各ポイントに、指定数の駒を描画するコンポーネント
 * @param props.count 駒数、正の値はWhite、負の値はRedの数を示す
 * @constructor
 */
export function Point(props: PointProps) {
    const [count, color] =
        props.count < 0 ? [-props.count, 'red'] : [props.count, 'white']

    const pieces: JSX.Element[] = [...Array(count)].map((value, index) => {
        return <div className="piece" key={index} />
    })

    return <div className={'point ' + color}>{pieces}</div>
}
