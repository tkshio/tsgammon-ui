import { score, Score } from 'tsgammon-core'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { GameState } from '../../dispatchers/utils/GameState'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { BGState, toState } from '../recordedGames/BGState'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { useCubeGameListeners } from '../useCubeGameListeners'
import { useSingleGameListeners } from '../useSingleGameListeners'
import './main.css'

export type PointMatchProps = {
    gameConf?: GameConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
    board?: GameState
    cbConfs?: CubefulGameConfs
}

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function PointMatch(props: PointMatchProps) {
    const {
        gameConf = standardConf,
        cbConfs = { sgConfs: {} },
        matchLength = 0,
        matchScore = score(),
        isCrawford = false
    } = props

    // 初期盤面（２回目以降の対局でも使用）はconfに応じて設定される
    const { cbState: openingCBState, sgState: openingSGState } = toState({
        absPos: gameConf.initialPos,
    })

    // 盤面の指定があれば、そこから開始
    const { cbState: initialCBState, sgState: initialSGState } = toState(
        props.board
    )
    const [cbState, cbListeners, setCBState] =
        useCubeGameListeners(initialCBState)
    const [sgState, sgListeners, setSGState] =
        useSingleGameListeners(initialSGState)

    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchLength,
        matchScore, 
        isCrawford,
        bgState: { cbState, sgState },
        cbConfs,
        ...cbListeners,
        ...sgListeners,
        onStartNextGame: () => {
            setCBState(openingCBState)
            setSGState(openingSGState)
        },
        onResumeState: (lastState: BGState) => {
            setCBState(lastState.cbState)
            setSGState(lastState.sgState)
        },
    }

    return <RecordedCubefulGame {...recordedMatchProps} />
}
