import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { SGState } from '../../dispatchers/SingleGameState'
import { GameState, toSGState } from '../../dispatchers/utils/GameState'
import {
    RecordedSingleGame,
    RecordedSingleGameProps,
} from '../recordedGames/RecordedSingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import { useSingleGameListeners } from '../useSingleGameListeners'

import './main.css'

export type UnlimitedSingleGameProps = {
    gameConf?: GameConf
    state?: GameState
    sgConfs?: SingleGameConfs
}

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function UnlimitedSingleGame(props: UnlimitedSingleGameProps) {
    const { gameConf = standardConf, state, sgConfs = {} } = props

    // 盤面の指定があれば、そこから開始
    const initialSGState = toSGState(state)

    // 初期盤面（２回目以降の対局でも使用）はconfに応じて設定される
    const openingSGState = toSGState({ absPos: gameConf.initialPos })

    const [sgState, listeners, setSGState] =
        useSingleGameListeners(initialSGState)

    const recordedMatchProps: RecordedSingleGameProps = {
        sgState,
        sgConfs,
        ...listeners,
        onStartNextGame: () => {
            setSGState(openingSGState)
        },
        onResumeState: (lastState: SGState) => {
            setSGState(lastState)
        },
    }

    return <RecordedSingleGame {...recordedMatchProps} />
}
