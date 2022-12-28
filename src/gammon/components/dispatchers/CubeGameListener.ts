import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from '../states/CubeGameState'

/**
 * キューブ状態の遷移の通知を受け付けるListener
 */
export type CubeGameListener = {
    onCubeGameStarted: () => void

    onAwaitCubeAction: (nextState: CBAction | CBToRoll) => void
    onCubeActionStarted: (nextState: CBAction) => void
    onCubeActionSkipped: (nextState: CBToRoll) => void
    onAwaitCheckerPlay: (nextState: CBInPlay) => void

    onDoubled: (nextState: CBResponse, lastState: CBAction) => void
    onDoubleAccepted: (nextState: CBToRoll, lastState: CBResponse) => void
    onPassed: (lastState: CBResponse, isRedWon: boolean) => void
    onEndOfCubeGame: (nextState: CBEoG) => void
}
