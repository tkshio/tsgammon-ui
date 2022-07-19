import { EOGStatus, score, Score } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { BGState, toState } from 'tsgammon-core/dispatchers/BGState'
import { buildBGEventHandler } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import { eogEventHandler } from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    matchStateForPointMatch,
    matchStateForUnlimitedMatch
} from 'tsgammon-core/dispatchers/MatchState'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import {
    eogRecord,
    MatchRecord,
    matchRecordInPlay,
    MatchRecordInPlay
} from 'tsgammon-core/records/MatchRecord'
import { plyRecordForEoG } from 'tsgammon-core/records/PlyRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { operateWithBGandRS } from '../operateWithRS'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps
} from '../recordedGames/RecordedCubefulGame'
import { useMatchRecorderForCubeGame } from '../recordedGames/useMatchRecorderForCubeGame'
import { useBGState } from '../useBGState'
import { useMatchKey } from '../useMatchKey'
import { useResignState } from '../useResignState'
import './main.css'

export type PointMatchProps = {
    gameConf?: GameConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
    board?: GameSetup
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
    const { bgState, setBGState } = useBGState(initialBGState)
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
            bgState,
            setEoG(
                initialBGState,
                gameConf,
                matchRecordInPlay<BGState>(gameConf, initialMatchState)
            )
        )

    // 記録された状態からの復元
    const onResumeState = (index: number) => {
        const { state } = matchRecorder.resumeTo(index)
        setBGState(state)
        // ここでautoOperationも実行しないといけないが、手を変更できたほうが便利だろう
    }
    const listeners: Partial<BGListener>[] = [
        setBGStateListener(defaultBGState(gameConf), setBGState),
        matchKeyAddOn,
        matchRecorderAddOn,
    ]

    // 降参機能
    const { resignState, rsDialogHandler: rsHandler } = useResignState(
        (result: SGResult, eog: EOGStatus) =>
            eogEventHandler(...listeners).onEndOfBGGame(bgState, result, eog)
    )

    // キューブありのゲームの進行管理
    const _bgEventHandlers = buildBGEventHandler(
        matchRecord.matchState.isCrawford,
        rollListener,
        ...listeners
    )

    // ゲーム進行の自動処理
    const { bgEventHandler, rsDialogHandler } = operateWithBGandRS(
        resignState,
        bgState,
        autoOperators,
        _bgEventHandlers,
        rsHandler
    )

    const recordedMatchProps: RecordedCubefulGameProps = {
        resignState,
        matchRecord,
        bgState,
        ...bgEventHandler,
        ...rsDialogHandler,
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
