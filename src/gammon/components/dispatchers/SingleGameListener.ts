import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'

/**
 * SingleGameについての状態遷移の通知を受け付けるListener
 */
export type SingleGameListener = {
    onGameStarted: () => void
    onOpeningCheckerPlayStarted: (nextState: SGInPlay) => void
    onCheckerPlayStarted: (nextState: SGInPlay) => void
    onCheckerPlayCommitted: (committedState: SGInPlay) => void
    onRerollOpening: (nextState: SGOpening) => void
    onAwaitRoll: (nextState: SGToRoll) => void
    onEndOfGame: (nextState: SGEoG) => void
}
