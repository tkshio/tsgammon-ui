import React from 'react';
import {Point} from "./Point";
import {Dice, DiceProps} from "./Dice";
import {Cube, CubeProps} from "./Cube";
import {BoardAction, BoardActionType} from "../models/BoardAction";
import {AbsoluteBoardState, initAbsoluteBoard} from "../models/AbsoluteBoardState";
import "./board.css"
import "./board.appearance.css"

export type BoardProps = {
    status: string
    board: AbsoluteBoardState
    redDices: DiceProps
    whiteDices: DiceProps
    centerCube?: CubeProps
    redCube?: CubeProps
    whiteCube?: CubeProps
    dialog?: JSX.Element
    revertButton?: JSX.Element
    dispatcher: (action: BoardAction) => void
}

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
 * @param props.revertButton 盤面右バーに表示される取り消しボタン
 * @param props.dispatcher BoardActionを受け取るdispatcher
 *
 * @constructor
 */
export function Board(props: BoardProps) {
    const {
        board = initAbsoluteBoard(),
        redDices = {dices: []},
        whiteDices = {dices: []},
        centerCube,
        redCube,
        whiteCube,
        dialog,
        revertButton,
        dispatcher = () => {
        },
    } = {...props};


    function renderColumn(pos: number) {
        const num = board.piecesAt(pos);
        const pointAction = {
            type: BoardActionType.Point,
            pos: pos,
            dices: redDices.dices.concat(whiteDices.dices)
        };

        return (
            <div className="column"
                 onClick={() => dispatcher(pointAction)}
            >
                <Point count={num}/>
                <div className={"triangle"}/>
            </div>
        );
    }

    function renderDices(dice: DiceProps, label: string) {
        return (
            <div className={"dice-space " + label}
                 onClick={() => dispatcher({
                     type: BoardActionType.Dice
                 })}
            >
                <Dice {...dice}/>
            </div>
        );
    }

    function renderCube(cube: CubeProps | undefined) {
        if (cube) {
            return (
                <div onClick={() => dispatcher({type: BoardActionType.Cube})}>
                    <Cube {...cube}/>
                </div>
            );
        }
    }

    return (
        <div data-testid={"tid_gammonboard"}>
            <div className="board">

                <div className={"innerBox"}>
                    <div className={"side-bar"}>
                        <div className={"goal upper"}>
                            <Point count={-board.redBornOff()}/>
                        </div>
                        <div className={"cube-space"}>
                            {renderCube(centerCube)}
                        </div>
                        <div className={"goal lower"}>
                            <Point count={board.whiteBornOff()}/>
                        </div>
                    </div>
                    <div className={"centerArea"}>
                        <div className={"inner"}>
                            <div>
                                <div className={"posIndex upper"}>
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
                            {renderDices(redDices, "left")}
                            <div>
                                <div className="table lower">
                                    {renderColumn(19)}
                                    {renderColumn(20)}
                                    {renderColumn(21)}
                                    {renderColumn(22)}
                                    {renderColumn(23)}
                                    {renderColumn(24)}
                                </div>
                                <div className={"posIndex lower"}>
                                    <span>1</span>
                                    <span>2</span>
                                    <span>3</span>
                                    <span>4</span>
                                    <span>5</span>
                                    <span>6</span>
                                </div>
                            </div>
                        </div>
                        <div className={"bar"}>
                            <div className={"upper"}>
                                {renderCube(redCube)}
                                {renderColumn(0)}
                            </div>
                            <div className={"lower"}>
                                {renderCube(whiteCube)}
                                {renderColumn(25)}
                            </div>
                        </div>
                        <div className={"outer"}>
                            <div>
                                <div className={"posIndex upper"}>
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
                            {renderDices(whiteDices, "right")}
                            <div>
                                <div className="table lower">
                                    {renderColumn(13)}
                                    {renderColumn(14)}
                                    {renderColumn(15)}
                                    {renderColumn(16)}
                                    {renderColumn(17)}
                                    {renderColumn(18)}
                                </div>
                                <div className={"posIndex lower"}>
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
                    {dialog}
                    <div className={"side-bar"}>
                        <div className={"goal upper"}/>
                        <div className={"cube-space"}>
                            {revertButton}
                        </div>
                        <div className={"goal lower"}/>
                    </div>
                </div>
            </div>
        </div>
    );
}