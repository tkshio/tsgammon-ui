import React from 'react'
import { CubeState } from 'tsgammon-core/CubeState'
import './cube.css'

export type CubeProps = {
    cube?: CubeState
    isCrawford?: boolean
    isCubeMaxForMatch?: boolean
}

/**
 * キューブを描画する。減実装では、キューブ値が1の場合は64に読み替えられる
 * @param props キューブの状態
 * @param props.cube undefinedの場合、キューブは単なる空のdiv要素として描画される
 * @constructor
 */
export function Cube(props: CubeProps) {
    if (props.cube) {
        const value = props.cube.value
        const pos = value === 1 ? ' UNDOUBLED' : ''
        const crawford = props.isCrawford ? ' CRAWFORD' : ''
        const max =
            !props.isCrawford && //
            (props.cube.isMax || props.isCubeMaxForMatch)
                ? ' MAX'
                : ''
        return (
            <div className={['cube', pos, crawford, max].join('')}>
                {value === 1 ? '' : value}
            </div>
        )
    }
    return <div />
}
