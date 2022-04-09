import React from 'react'
import { CubeState } from 'tsgammon-core/CubeState'
import './cube.css'

export type CubeProps = {
    cube?: CubeState
}

/**
 * キューブを描画する。減実装では、キューブ値が1の場合は64に読み替えられる
 * @param props キューブの状態
 * @param props.cube undefinedの場合、キューブは単なる空のdiv要素として描画される
 * @constructor
 */
export function Cube(props: CubeProps) {
    if (props.cube) {
        const value = props.cube.value === 1 ? 64 : props.cube.value
        return (
            <div className={'cube' + (props.cube.isMax ? ' MAX' : '')}>
                {value}
            </div>
        )
    }
    return <div />
}
