import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGListener } from './BGListener'
import { BGState } from '../states/BGState'
import { cubeGameDispatcher } from './CubeGameDispatcher'
import { CBEoG } from '../states/CubeGameState'
import { singleGameDispatcher } from './SingleGameDispatcher'
import { SingleGameListener } from './SingleGameListener'
import { SGState } from '../states/SingleGameState'
import { concat1 } from './utils/concat'

/**
 * ゲームを終了させるときに呼ぶ操作：降参時、またはキューブありのゲームでチェッカープレイでの終局時に呼ばれる
 * （キューブパスの場合の終局は、cubeGameDispatcherの管理となる）。
 */
export type BGEoGHandler = {
    onEndOfBGGame: (
        bgState: BGState,
        sgResult: SGResult,
        eog: EOGStatus
    ) => void
}
export function eogEventHandler(
    ...listeners: Partial<BGListener>[]
): BGEoGHandler {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur)),
    }
    return {
        onEndOfBGGame: (
            bgState: BGState,
            sgResult: SGResult,
            eog: EOGStatus
        ) => {
            const result = cubeGameDispatcher.doEndOfCubeGame(
                bgState.cbState,
                sgResult,
                eog
            )
            result({
                onEndOfCubeGame: (nextState: CBEoG) => {
                    listener.onEndOfBGGame?.({
                        cbState: nextState,
                        sgState: bgState.sgState,
                    })
                },
            })
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<BGListener, 'onEndOfBGGame'>>,
        listener2: Partial<Pick<BGListener, 'onEndOfBGGame'>>
    ): Partial<Pick<BGListener, 'onEndOfBGGame'>> {
        return {
            onEndOfBGGame: concat1(
                listener1.onEndOfBGGame,
                listener2.onEndOfBGGame
            ),
        }
    }
}
export type SGEoGHandler = {
    onEndOfGame: (sgState: SGState, sgResult: SGResult, eog: EOGStatus) => void
}
export function eogEventHandlersSG(
    ...listeners: Partial<SingleGameListener>[]
): SGEoGHandler {
    const listener = {
        onEndOfGame: () => {
            //
        },
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur)),
    }
    return {
        onEndOfGame: (sgState: SGState, sgResult: SGResult, eog: EOGStatus) => {
            const result = singleGameDispatcher.doEndOfGame(
                sgState,
                sgResult,
                eog
            )
            result(listener)
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<SingleGameListener, 'onEndOfGame'>>,
        listener2: Partial<Pick<SingleGameListener, 'onEndOfGame'>>
    ) {
        return {
            onEndOfGame: concat1(listener1.onEndOfGame, listener2.onEndOfGame),
        }
    }
}
