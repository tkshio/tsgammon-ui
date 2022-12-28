import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from '../states/CubeGameState'

/**
 * キューブ状態を操作するための定義: 現在はBGEventHandlerで操作するので、
 * このインターフェースは実装されていない
 */
export type CubeGameEventHandler = {
    onStartCubeGame: () => void

    onTake: (cbState: CBResponse) => void
    onPass: (cbState: CBResponse) => void
    onDouble: (cbState: CBAction) => void

    onStartOpeningCheckerPlay: (cbState: CBOpening, isRed: boolean) => void
    onStartCheckerPlay: (cbState: CBToRoll | CBAction) => void
    onStartCubeAction: (cbState: CBInPlay, skipCubeAction: boolean) => void
    onSkipCubeAction: (cbState: CBAction) => void
}
