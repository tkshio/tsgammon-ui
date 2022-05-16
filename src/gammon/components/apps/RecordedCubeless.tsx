import { rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import {
    RecordedSingleGame,
    RecordedSingleGameProps,
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { SingleGameConfs } from '../SingleGameBoard'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'
import { addMatchRecorderToSG } from './PointMatch'

export type UnlimitedSingleGameProps = {
    gameConf?: GameConf
    state?: GameSetup
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

    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })
    const { sgState, singleGameEventHandlers, gameEventHandlers, setSGState } =
        useSingleGameState(gameConf, initialSGState, rollListener)
    const [matchRecord, matchRecorder] = useMatchRecorder<SGState>(gameConf)
    const { eventHandlers } = addMatchRecorderToSG(
        singleGameEventHandlers,
        gameEventHandlers,
        setSGState,
        matchRecorder
    )

    const recordedMatchProps: RecordedSingleGameProps = {
        sgState,
        sgConfs,
        matchRecord,
        ...eventHandlers,
    }

    return <RecordedSingleGame {...recordedMatchProps} />
}

/*
function asListeners(
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameListeners> {
    return { onAwaitRoll, onEndOfGame }

    function onAwaitRoll(nextState: SGToRoll) {
        const lastState = nextState.lastState()
        const plyRecord = plyRecordForCheckerPlay(lastState.curPly)
        matchRecorder.recordPly(plyRecord, lastState)
    }

    function onEndOfGame(nextState: SGEoG) {
        const lastState = nextState.lastState()
        const plyRecord = plyRecordForCheckerPlay(lastState.curPly)
        matchRecorder.recordPly(plyRecord, lastState)
        const plyRecordEoG = plyRecordForEoG(nextState.stake, nextState.result, nextState.eogStatus)
        matchRecorder.recordEoG(plyRecordEoG)
    }
}
*/
