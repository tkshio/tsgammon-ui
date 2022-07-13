import { EOGStatus, score, Score } from 'tsgammon-core'
import { BGState, toState } from 'tsgammon-core/dispatchers/BGState'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { setCBStateListener } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import { eogEventHandlers } from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    matchStateForPointMatch,
    matchStateForUnlimitedMatch,
} from 'tsgammon-core/dispatchers/MatchState'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import {
    eogRecord,
    MatchRecord,
    matchRecordInPlay,
    MatchRecordInPlay,
} from 'tsgammon-core/records/MatchRecord'
import { plyRecordForEoG } from 'tsgammon-core/records/PlyRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { useMatchRecorderForCubeGame } from '../recordedGames/useMatchRecorderForCubeGame'
import { OperationConfs } from '../SingleGameBoard'
import { useCubeGameState } from '../useCubeGameState'
import { useMatchKey } from '../useMatchKey'
import { useResignState } from '../useResignState'
import { useSingleGameState } from '../useSingleGameState'
import { operateWithRS } from '../withRSAutoOperator'
import './main.css'
import { operateForBGRS } from './operateWithCB'

export type PointMatchProps = {
    gameConf?: GameConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
    board?: GameSetup
    opConfs?: OperationConfs
    autoOperators?: { cb: CBOperator; sg: SGOperator; rs?: RSOperator }
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
        opConfs,
        autoOperators = { cb: undefined, sg: undefined, rs: undefined },
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
    const initialBGState = toState(props.board)
    // 状態管理
    const { sgState, setSGState } = useSingleGameState(initialBGState.sgState)
    const { cbState, setCBState } = useCubeGameState(initialBGState.cbState)
    // マッチにユニークなKeyを採番する
    const { matchKey, matchKeyAddOn } = useMatchKey()

    // マッチポイントの管理
    const initialMatchState =
        matchLength === 0
            ? matchStateForUnlimitedMatch(
                  curScore,
                  gameConf.jacobyRule,
                  isCrawford
              )
            : matchStateForPointMatch(matchLength, curScore, isCrawford)

    // マッチの記録に必要なListener
    const { matchRecord, matchRecorder, matchRecorderAddOn } =
        useMatchRecorderForCubeGame(
            gameConf,
            cbState,
            sgState,
            setEoG(
                initialBGState,
                gameConf,
                matchRecordInPlay<BGState>(gameConf, initialMatchState)
            )
        )

    // 記録された状態からの復元
    const onResumeState = (index: number) => {
        const { state } = matchRecorder.resumeTo(index)
        setCBState(state.cbState)
        setSGState(state.sgState)
    }
    const listeners = [
        setCBStateListener(defaultBGState(gameConf).cbState, setCBState),
        setSGStateListener(defaultBGState(gameConf).sgState, setSGState),
        matchKeyAddOn,
        matchRecorderAddOn,
    ]

    // 降参機能
    const { resignState, resignEventHandlers: _resignEventHandlers } =
        useResignState((result: SGResult, eog: EOGStatus) =>
            eogEventHandlers(listeners).onEndOfCubeGame(cbState, result, eog)
        )

    // キューブありのゲームの進行管理
    const _bgEventHandlers = cubefulGameEventHandlers(
        matchRecord.matchState.isCrawford,
        rollListener,
        ...listeners
    )

    // 降参機能の自動処理
    const { sgListeners, resignEventHandlers } = operateWithRS(
        { cbState, sgState },
        autoOperators.rs,
        _resignEventHandlers
    )
    const bgEventHandlers = _bgEventHandlers.addListeners(sgListeners)

    // ゲーム進行の自動処理
    const bgEventHandlersWithAutoOp = operateForBGRS(
        resignState,
        autoOperators,
        bgEventHandlers
    )

    /*
    useCBAutoOperatorWithRS(
        resignState,
        cbState,
        sgState,
        autoOperators,
        bgEventHandlers
    )*/

    const recordedMatchProps: RecordedCubefulGameProps = {
        resignState,
        matchRecord,
        bgState: { sgState, cbState },
        opConfs,
        ...bgEventHandlersWithAutoOp,
        ...resignEventHandlers,
        onResumeState,
    }

    return <RecordedCubefulGame key={matchKey} {...recordedMatchProps} />
}

// 初期状態がEoGの場合、Listenerに代わってMatchRecordにEoGを記録する
function setEoG(
    curBGState: BGState,
    stakeConf: StakeConf,
    mRecord: MatchRecordInPlay<BGState>
): MatchRecord<BGState> {
    if (curBGState.cbState.tag === 'CBEoG') {
        const eogPlyRecord = plyRecordForEoG(
            curBGState.cbState.calcStake(stakeConf).stake,
            curBGState.cbState.result,
            curBGState.cbState.eogStatus
        )
        return eogRecord(mRecord, eogPlyRecord)
    }
    return mRecord
}
