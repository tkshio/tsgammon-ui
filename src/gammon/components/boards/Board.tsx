import React from 'react'
import {
    AbsoluteBoardState,
    initAbsoluteBoard,
} from 'tsgammon-core/AbsoluteBoardState'
import { CubeOwner, CubeState } from 'tsgammon-core/CubeState'
import { Dice } from 'tsgammon-core/Dices'
import { Cube, CubeProps } from './Cube'
import { BlankDice, Dice as DiceComponent, DiceProps } from './Dice'
import { Point } from './Point'

import './board.appearance.css'
import './board.css'

export type DiceLayout = {
    redDices: DiceProps
    whiteDices: DiceProps
}

export type BoardEventHandlers = {
    onClickPoint: (pos: number, dices: Dice[]) => void
    onClickCube: () => void
    onClickDice: () => void
}

export type BoardProps = {
    board: AbsoluteBoardState
    redDices: DiceProps
    whiteDices: DiceProps
    centerCube?: CubeProps
    redCube?: CubeProps
    whiteCube?: CubeProps
    centerButton?: JSX.Element | null
    upperButton?: JSX.Element | null
    lowerButton?: JSX.Element | null
    dialog?: JSX.Element
} & Partial<BoardEventHandlers>

/**
 * 盤面と、ゲームの進行に直接かかわるダイアログを表示する
 * @param props 盤面上に表示される各要素
 * @param props.status 状況を示す任意の文字列
 * @param props.board  盤面を表すオブジェクト
 * @param props.redDices 赤側のダイス
 * @param props.centerCube バー中央に表示するキューブ
 * @param props.redCube 赤側にあるキューブ
 * @param props.whiteCube 白側にあるキューブ
 * @param props.dialog 盤面に中央に表示するダイアログ
 * @param props.cubeSpace 盤面右バーに配置するコンポーネント
 * @param props.onClickPoint 駒またはポイントがクリックされた時のイベントハンドラ
 * @param props.onClickCube ダブリングキューブがクリックされた時のイベントハンドラ
 * @param props.onClickDice ダイスがクリックされた時のイベントハンドラ
 *
 * @constructor
 */
export function Board(props: BoardProps) {
    const {
        board = initAbsoluteBoard(),
        redDices = { dices: [] },
        whiteDices = { dices: [] },
        centerCube,
        redCube,
        whiteCube,
        centerButton,
        upperButton,
        lowerButton,
        onClickCube = () => {
            //
        },
        onClickDice = () => {
            //
        },
        onClickPoint = () => {
            //
        },
        dialog
    } = { ...props }

    function renderColumn(pos: number) {
        const num = board.piecesAt(pos)
        const dices: Dice[] = (
            redDices.dices.length !== 0 ? redDices : whiteDices
        ).dices.filter((d: BlankDice | Dice): d is Dice => d.pip !== 0)

        return (
            <div
                className="column"
                onClick={() => onClickPoint(pos, dices)}
                data-testid={`point-${pos}`}
            >
                <Point count={num} />
                <div className={'triangle'} />
            </div>
        )
    }

    function renderDices(dice: DiceProps, label: string) {
        return (
            <div
                className={'dice-space ' + label}
                onClick={onClickDice}
                data-testid={`dice-${label}`}
            >
                <DiceComponent {...dice} />
            </div>
        )
    }

    function renderCube(cube: CubeProps | undefined) {
        if (cube) {
            return (
                <div onClick={onClickCube}>
                    <Cube {...cube} />
                </div>
            )
        }
    }

    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)

    return (
        <div className="boardContainer" data-testid={'tid_gammonboard'}>
            {dialog}
            <div className="board">
                <div className={'innerBox'}>
                    <div className={'side-bar'}>
                        <div className={'goal upper'}>
                            <Point count={-board.redBornOff()} />
                        </div>
                        <div className={'cube-space'}>
                            {renderCube(centerCube)}
                        </div>
                        <div className={'goal lower'}>
                            <Point count={board.whiteBornOff()} />
                        </div>
                    </div>
                    <div className={'centerArea'}>
                        <div className={'inner'}>
                            <div>
                                <div className={'posIndex upper'}>
                                    <div>24</div>
                                    <div>23</div>
                                    <div>22</div>
                                    <div>21</div>
                                    <div>20</div>
                                    <div>19</div>
                                </div>
                                <div className="table upper">
                                    {renderColumn(1)}
                                    {renderColumn(2)}
                                    {renderColumn(3)}
                                    {renderColumn(4)}
                                    {renderColumn(5)}
                                    {renderColumn(6)}
                                </div>
                            </div>
                            {renderDices(redDices, 'left')}
                            <div>
                                <div className="table lower">
                                    {renderColumn(19)}
                                    {renderColumn(20)}
                                    {renderColumn(21)}
                                    {renderColumn(22)}
                                    {renderColumn(23)}
                                    {renderColumn(24)}
                                </div>
                                <div className={'posIndex lower'}>
                                    <span>1</span>
                                    <span>2</span>
                                    <span>3</span>
                                    <span>4</span>
                                    <span>5</span>
                                    <span>6</span>
                                </div>
                            </div>
                        </div>
                        <div className={'bar'}>
                            <div className={'upper'}>
                                {renderCube(redCube)}
                                {renderColumn(0)}
                            </div>
                            <div className={'lower'}>
                                {renderCube(whiteCube)}
                                {renderColumn(25)}
                            </div>
                        </div>
                        <div className={'outer'}>
                            <div>
                                <div className={'posIndex upper'}>
                                    <span>18</span>
                                    <span>17</span>
                                    <span>16</span>
                                    <span>15</span>
                                    <span>14</span>
                                    <span>13</span>
                                </div>
                                <div className="table upper">
                                    {renderColumn(7)}
                                    {renderColumn(8)}
                                    {renderColumn(9)}
                                    {renderColumn(10)}
                                    {renderColumn(11)}
                                    {renderColumn(12)}
                                </div>
                            </div>
                            {renderDices(whiteDices, 'right')}
                            <div>
                                <div className="table lower">
                                    {renderColumn(13)}
                                    {renderColumn(14)}
                                    {renderColumn(15)}
                                    {renderColumn(16)}
                                    {renderColumn(17)}
                                    {renderColumn(18)}
                                </div>
                                <div className={'posIndex lower'}>
                                    <span>7</span>
                                    <span>8</span>
                                    <span>9</span>
                                    <span>10</span>
                                    <span>11</span>
                                    <span>12</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={'side-bar'}>
                        <div className={'goal upper'} />
                        <div className={'button-space upper'} >{upperButton??ZERO_WIDTH_SPACE}</div>
                        <div className={'cube-space'}>{centerButton??ZERO_WIDTH_SPACE}</div>
                        <div className={'button-space lower'} >{lowerButton??ZERO_WIDTH_SPACE}</div>
                        <div className={'goal lower'} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function layoutCube(cubeState?: CubeState): {
    centerCube?: CubeProps
    redCube?: CubeProps
    whiteCube?: CubeProps
} {
    const cube = { cube: cubeState }
    const cubeOwner = cubeState?.owner
    const [centerCube, redCube, whiteCube] = doLayout()

    return { centerCube, redCube, whiteCube }

    function doLayout() {
        if (cubeOwner === undefined) {
            return [cube, undefined, undefined]
        }
        switch (cubeOwner) {
            case CubeOwner.WHITE:
                return [undefined, undefined, cube]
            case CubeOwner.RED:
                return [undefined, cube, undefined]
        }
    }
}

export function decorate(
    base: Partial<BoardEventHandlers>,
    addOn: Partial<BoardEventHandlers>
): BoardEventHandlers {
    const {
        onClickDice: onClickDiceAddOn,
        onClickPoint: onClickPointAddOn,
        onClickCube: onClickCubeAddOn,
    } = addOn

    const {
        onClickDice = () => {
            //
        },
        onClickPoint = () => {
            //
        },
        onClickCube = () => {
            //
        },
    } = base

    const decorated = {
        onClickDice: onClickDiceAddOn
            ? () => {
                  onClickDiceAddOn()
                  onClickDice()
              }
            : onClickDice,
        onClickPoint: onClickPointAddOn
            ? (absPos: number, dice: Dice[]) => {
                  onClickPointAddOn(absPos, dice)
                  onClickPoint(absPos, dice)
              }
            : onClickPoint,
        onClickCube: onClickCubeAddOn
            ? () => {
                  onClickCubeAddOn()
                  onClickCube()
              }
            : onClickCube,
    }

    return decorated
}
