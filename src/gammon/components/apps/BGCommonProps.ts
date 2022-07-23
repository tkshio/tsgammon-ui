import { GameConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { PlayersConf } from '../PlayersConf'

export type BGCommonProps = {
    gameConf?: GameConf
    playersConf?: PlayersConf
    gameSetup?: GameSetup
    diceSource?: DiceSource
    dialog?: JSX.Element
    recordMatch?: boolean
} & Partial<
    RollListener &
        SingleGameListener &
        CheckerPlayListeners &
        BoardEventHandlers
>
