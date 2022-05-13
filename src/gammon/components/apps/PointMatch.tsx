import { useState } from 'react'
import { score, Score } from 'tsgammon-core'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import {
    matchRecord as initMatchRecord,
    MatchRecord,
    setEoGRecord,
} from 'tsgammon-core/records/MatchRecord'
import { plyRecordForEoG } from 'tsgammon-core/records/PlyRecord'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { CubeGameEventHandlers } from '../CubeGameEventHandlers'
import { BGState, toState } from '../recordedGames/BGState'
import {
    GameEventHandler,
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { SingleGameEventHandlers } from '../SingleGameBoard'
import { useCubeGameState } from '../useCubeGameState'
import './main.css'

export type PointMatchProps = {
    gameConf?: GameConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
    board?: GameSetup
    cbConfs?: CubefulGameConfs
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
} & Partial<RollListener>

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
        matchScore: curScore = score(),
        isCrawford = false,
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
    } = props

    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })

    // 盤面の指定があれば、そこから開始
    const { cbState: initialCBState, sgState: initialSGState } = toState(
        props.board
    )

    // Propsで指定したマッチ情報は初期化の時に一回だけ参照される
    const initialMatchRecord = setEoG(
        { cbState: initialCBState, sgState: initialSGState },
        gameConf,
        initMatchRecord<BGState>(gameConf, matchLength, curScore, isCrawford)
    )

    const {
        cbState,
        sgState,
        eventHandlers: cbEventHandlers,
    } = useCubeGameState(
        gameConf,
        isCrawford,
        initialSGState,
        initialCBState,
        rollListener
    )

    const { matchRecord, matchID, eventHandlers } =
        useCubeGameEventHandlerWithMatchRecorder(
            gameConf,
            initialMatchRecord,
            cbEventHandlers
        )
    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchScore: matchRecord.matchScore,
        matchRecord,
        bgState: { cbState, sgState },
        cbConfs,
        ...eventHandlers,
    }

    return <RecordedCubefulGame key={matchID} {...recordedMatchProps} />
}

// 初期状態がEoGの場合、Listenerに代わってMatchRecordにEoGを記録する
function setEoG(
    curBGState: BGState,
    stakeConf: StakeConf,
    mRecord: MatchRecord<BGState>
) {
    if (curBGState.cbState.tag === 'CBEoG') {
        const eogRecord = plyRecordForEoG(
            curBGState.cbState.calcStake(stakeConf).stake,
            curBGState.cbState.result,
            curBGState.cbState.eogStatus
        )
        return setEoGRecord(mRecord, eogRecord)
    }
    return mRecord
}

export function useCubeGameEventHandlerWithMatchRecorder(
    gameConf: GameConf,
    initialMatchRecord: MatchRecord<BGState>,
    eventHandlers: SingleGameEventHandlers & CubeGameEventHandlers
): {
    eventHandlers: GameEventHandler<BGState> &
        CubeGameEventHandlers &
        SingleGameEventHandlers
    matchRecord: MatchRecord<BGState>
    matchID: number
} {
    const [matchRecord, matchRecorder] = useMatchRecorder<BGState>(
        gameConf,
        initialMatchRecord
    )
    const [matchID, setMatchID] = useState(0)
    const gameEventHandlers: GameEventHandler<BGState> = {
        onStartNextGame: () => {
            eventHandlers.onReset()
            matchRecorder.resetCurGame()
        },
        onResumeState: (index: number, lastState: BGState) => {
            eventHandlers.onSetCBState(lastState.cbState)
            eventHandlers.onSetSGState(lastState.sgState)
            matchRecorder.resumeTo(index)
        },
        onEndOfMatch: () => {
            eventHandlers.onReset()
            setMatchID((mid) => mid + 1)
        },
    }
    return {
        eventHandlers: {
            ...eventHandlers,
            ...gameEventHandlers,
        },
        matchRecord,
        matchID,
    }
}
