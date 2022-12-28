import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from 'tsgammon-core/states/CubeGameState'
import {
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'

/**
 * BGEventHandlerの提供する各操作について、それを適用した結果発生するイベントが通知されるListener：引数には、イベント発生後の状態が渡される
 */
export type BGListener = {
    /**
     * ゲームが開始した
     */
    onBGGameStarted: () => void

    /**
     * オープニングロールで同じ目が出て振り直しになった
     */
    onBGOpeningRerolled: (bgState: {
        cbState: CBOpening
        sgState: SGOpening
    }) => void

    /**
     * キューブアクション待ちになった（ダブルの可否を問わず呼ばれる）
     */
    onAwaitCubeAction: (bgState: {
        cbState: CBAction | CBToRoll
        sgState: SGToRoll
    }) => void

    /**
     * キューブアクション待ちになった（ダブルが可能な場合のみ、onAwaitCubeActionに続けて呼ばれる）
     */
    onCubeActionStarted: (bgState: {
        cbState: CBAction
        sgState: SGToRoll
    }) => void

    /**
     * キューブアクションをスキップした（ダブルできない場合、onAwaitCubeActionに続けて呼ばれる）
     */
    onCubeActionSkipped: (bgState: {
        cbState: CBToRoll
        sgState: SGToRoll
    }) => void

    /**
     * ダブルされた
     */
    onDoubled: (
        bgState: { cbState: CBResponse; sgState: SGToRoll },
        lastState: CBAction
    ) => void

    /**
     * テイクされた
     */
    onDoubleAccepted: (
        bgState: { cbState: CBToRoll; sgState: SGToRoll },
        lastState: CBResponse
    ) => void

    /**
     * パスされた
     */
    onPassed: (
        bgState: { cbState: CBResponse; sgState: SGToRoll },
        isRedWon: boolean
    ) => void

    /**
     * （ロールが行われ）チェッカープレイ待ちになった
     */
    onAwaitCheckerPlay: (bgState: {
        cbState: CBInPlay
        sgState: SGInPlay
    }) => void

    /**
     * （チェッカープレイが行われ）チェッカープレイが確定した
     */
    onCommitted: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => void

    /**
     * ゲームが終了した
     */
    onEndOfBGGame: (bgState: { cbState: CBEoG; sgState: SGState }) => void
}
