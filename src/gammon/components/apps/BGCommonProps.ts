import { GameConf, Score } from 'tsgammon-core'
import { GameSetup } from 'tsgammon-core/states/utils/GameSetup'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { CheckerPlayListeners } from '../dispatchers/CheckerPlayDispatcher'
import { RollListener } from '../dispatchers/RollDispatcher'
import { PlayersConf } from '../PlayersConf'

export type BGCommonProps = {
    gameConf?: GameConf
    playersConf?: PlayersConf
    gameSetup?: GameSetup
    diceSource?: DiceSource
    dialog?: JSX.Element
    recordMatch?: boolean
    matchScore?: Score
    matchLength?: number
    isCrawford?: boolean
} & Partial<RollListener & CheckerPlayListeners & BoardEventHandlers>
