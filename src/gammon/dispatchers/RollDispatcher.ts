import { BoardStateNode } from "tsgammon-core/BoardStateNode";
import { DiceRoll } from "tsgammon-core/Dices";
import { DiceSource } from "tsgammon-core/utils/DiceSource";
import {
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners
} from "./SingleGameDispatcher";
import { SGEoG, SGInPlay, SGOpening, SGToRoll } from "./SingleGameState";

export interface RollDispatcher {
    doRollRequest(rollReq: (dices: DiceRoll) => void): void
}

export interface RollListener {
    onRollRequest: (rollReq: (dices: DiceRoll) => void) => void
}

export type RollReqs = {
    reqs: ((dices: DiceRoll) => void)[]
}

export function rollListeners(
    conf: { isRollHandlerEnabled: false, diceSource: DiceSource, } |
    { isRollHandlerEnabled: true, rollListener: RollListener }
): RollListener {

    // diceSourceが指定されている場合は普通にロールを行い、そうでない場合は、listnerに任せる
    // rollListenerはStoriesなどによって自動的に指定される場合があるので、別途フラグを設けている

    return {
        onRollRequest: (conf.isRollHandlerEnabled) ?
            (rollReq: (dices: DiceRoll) => void): void => {
                conf.rollListener.onRollRequest(rollReq);
            } :
            (rollReq: (dices: DiceRoll) => void): void => {
                rollReq(conf.diceSource.roll())
            }
    }
}

export type SingleGameDispatcherWithRD = {
    doOpeningRoll: (state: SGOpening) => void
    doCommitCheckerPlay: (state: SGInPlay, curBoardState: BoardStateNode) => SGToRoll | SGEoG
    doRoll: (state: SGToRoll) => void
}

export function rollDispatcher(listener: RollListener): RollDispatcher {
    return {
        doRollRequest: (rollReq: (dices: DiceRoll) => void): void => {
            listener.onRollRequest(rollReq)
        }
    }
}

export function singleGameDispatcherWithRD(sgListeners: Partial<SingleGameListeners>, rollHandler: RollListener): SingleGameDispatcherWithRD {
    return addRoller(singleGameDispatcher(sgListeners), rollDispatcher(rollHandler))
}

export function addRoller(sd: SingleGameDispatcher, rDispatcher: RollDispatcher)
    : SingleGameDispatcherWithRD {
    return {
        doCommitCheckerPlay: sd.doCommitCheckerPlay,
        doOpeningRoll: (state: SGOpening) => {
            rDispatcher.doRollRequest((dices: DiceRoll) => {
                sd.doOpeningRoll(state, dices)
            })
        },
        doRoll: (state: SGToRoll) => {
            rDispatcher.doRollRequest((dices: DiceRoll) => {
                sd.doRoll(state, dices)
            })
        }
    }
}
