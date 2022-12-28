import {
    SGInPlay,
    SGOpening,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'
import { SingleGameListener } from './SingleGameListener'

/**
 * SingleGameについてU.I.として提供される定義：引数には、イベント発生前の状態を渡さないといけない。
 *
 */
export type SingleGameEventHandler = {
    onStartGame: () => void

    onCommit: (sgState: SGInPlay) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void
}

export type SingleGameEventHandlerExtensible = SingleGameEventHandler & {
    addListeners: (
        ...sgListeners: Partial<SingleGameListener>[]
    ) => SingleGameEventHandlerExtensible
}
