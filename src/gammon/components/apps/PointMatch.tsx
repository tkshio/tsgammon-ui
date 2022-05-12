import { useState } from 'react'
import { DiceRoll, score, Score } from 'tsgammon-core'
import { cubefulSGListener } from 'tsgammon-core/dispatchers/cubefulSGListener'
import {
    CubeGameDispatcher,
    cubeGameDispatcher,
    decorate as decorateCB,
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate as decorateSG,
    singleGameDispatcher,
    SingleGameDispatcher,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGOpening, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
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
import { CubefulGameConfs, CubeGameEventHandlers } from '../CubefulGameBoard'
import { asCBListeners, asSGListeners } from '../recordedGames/addRecorders'
import { BGState, toState } from '../recordedGames/BGState'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { useMatchRecorder } from '../recordedGames/useMatchRecorder'
import { SingleGameEventHandlers } from '../SingleGameBoard'
import { useCubeGameListeners } from '../useCubeGameListeners'
import { useSingleGameListeners } from '../useSingleGameListeners'
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
    const [matchID, setMatchID] = useState(0)
    const [matchScore, setMatchScore] = useState(curScore)

    // Propsで指定したマッチ情報は初期化の時に一回だけ参照される
    const initialMatchRecord = setEoG(
        { cbState, sgState },
        gameConf,
        initMatchRecord<BGState>(gameConf, matchLength, matchScore, isCrawford)
    )

    const [matchRecord, matchRecorder] = useMatchRecorder<BGState>(
        gameConf,
        initialMatchRecord
    )
    function cubeGameEH(dispatcher: CubeGameDispatcher): CubeGameEventHandlers {
        return {
            onDoubleOffer: dispatcher.doDouble,
            onTake: dispatcher.doTake,
            onPass: dispatcher.doPass,
        }
    }
    const cbDispatcher = cubeGameDispatcher(
        isCrawford,
        decorateCB(
            asCBListeners(matchRecorder, gameConf, { cbState, sgState }),
            cbListeners
        )
    )
    const cubeGameEventHandlers: CubeGameEventHandlers =
        cubeGameEH(cbDispatcher)
    function sgEH(dispatcher: SingleGameDispatcher): SingleGameEventHandlers {
        return {
            onCommit: dispatcher.doCommitCheckerPlay,
            onRoll: (sgState: SGToRoll) =>
                rollListener.onRollRequest((dices: DiceRoll) => {
                    console.log(sgState, dices)
                    dispatcher.doRoll(sgState, dices)
                }),
            onRollOpening: (sgState: SGOpening) =>
                rollListener.onRollRequest((dices: DiceRoll) =>
                    dispatcher.doOpeningRoll(sgState, dices)
                ),
        }
    }
    const singleGameEventHandlers: SingleGameEventHandlers = sgEH(
        singleGameDispatcher(
            decorateSG(
                asSGListeners(matchRecorder, { cbState, sgState }),
                cubefulSGListener(sgListeners, cbState, cbDispatcher)
            )
        )
    )

    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchLength,
        matchScore,
        isCrawford,
        matchRecord,
        bgState: { cbState, sgState },
        cbConfs,
        ...cubeGameEventHandlers,
        ...singleGameEventHandlers,
        onStartNextGame: () => {
            setCBState(openingCBState)
            setSGState(openingSGState)
        },
        onResumeState: (index: number, lastState: BGState) => {
            setCBState(lastState.cbState)
            setSGState(lastState.sgState)
            matchRecorder.resumeTo(index)
        },
        onEndOfMatch: () => {
            setMatchID((mid) => mid + 1)
            setMatchScore(score())
            setCBState(openingCBState)
            setSGState(openingSGState)
        },
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
