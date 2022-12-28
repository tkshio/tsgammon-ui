import { DiceRoll } from 'tsgammon-core/Dices'
import { SGOpening, SGToRoll } from 'tsgammon-core/states/SingleGameState'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { SingleGameDispatcher } from './SingleGameDispatcher'
import { SingleGameListener } from './SingleGameListener'

/**
 * ロールが必要な処理を受け付けるListener: これは、ダイスロールを非同期的に行うために設けられている
 */
export interface RollListener {
    onRollRequest: (rollReq: (dices: DiceRoll) => void) => void
}

/**
 * ダイスロールを要求するタスクの定義
 */
export type RollReqs = {
    reqs: ((dices: DiceRoll) => void)[]
}

/**
 * 設定情報からRollListenerオブジェクトを生成する
 * @param conf RollReqを受け付ける関数、または単純にロール目を生成するDiceSourceオブジェクトを指定する
 * @returns
 */
export function rollListener(
    conf: {
        onRollRequest?: (rollReq: (dices: DiceRoll) => void) => void
        diceSource?: DiceSource
    } = {}
): RollListener {
    //rollListnerの指定があればそちらに任せ、そうでなければDiceSourceを適宜補完して処理する
    const { onRollRequest, diceSource = randomDiceSource } = conf
    return {
        onRollRequest:
            onRollRequest !== undefined
                ? (rollReq: (dices: DiceRoll) => void): void => {
                      onRollRequest(rollReq)
                  }
                : async (rollReq: (dices: DiceRoll) => void): Promise<void> => {
                      const roll = await Promise.resolve(diceSource.roll())
                      rollReq(roll)
                  },
    }
}

/**
 * SingleGameDispatcherを、ロール目を意識しない形に読み替えた形
 */
export type SingleGameDispatcherWithRL = Omit<
    SingleGameDispatcher,
    'doRoll' | 'doOpeningRoll'
> & {
    doRoll: (
        state: SGToRoll
    ) => (listener: Pick<SingleGameListener, 'onCheckerPlayStarted'>) => void
    doOpeningRoll: (
        state: SGOpening
    ) => (
        listener: Pick<
            SingleGameListener,
            'onOpeningCheckerPlayStarted' | 'onRerollOpening'
        >
    ) => void
}

/**
 * SingleGameDispatcherをロール目を意識しない形に読み替える
 * @param singleGameDispatcher
 * @param rollListener
 * @returns
 */
export function withRL(
    singleGameDispatcher: SingleGameDispatcher,
    rollListener: RollListener
): SingleGameDispatcherWithRL {
    return {
        ...singleGameDispatcher,
        doRoll: (state: SGToRoll) => {
            return (
                listener: Pick<SingleGameListener, 'onCheckerPlayStarted'>
            ) => {
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = singleGameDispatcher.doRoll(state, dices)
                    result(listener)
                })
            }
        },
        doOpeningRoll: (state: SGOpening) => {
            return (
                listener: Pick<
                    SingleGameListener,
                    'onOpeningCheckerPlayStarted' | 'onRerollOpening'
                >
            ) => {
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = singleGameDispatcher.doOpeningRoll(
                        state,
                        dices
                    )
                    result(listener)
                })
            }
        },
    }
}
