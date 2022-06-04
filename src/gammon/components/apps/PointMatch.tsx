import { score, Score } from 'tsgammon-core'
import { BGState, toState } from 'tsgammon-core/dispatchers/BGState'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import { matchStateForUnlimitedMatch, matchStateForPointMatch } from 'tsgammon-core/dispatchers/MatchState'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
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
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { CBOperator } from '../operators/CBOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { useMatchRecorderForCubeGame } from '../recordedGames/useMatchRecorderForCubeGame'
import { useCubeGameState } from '../useCubeGameState'
import { useMatchKey } from '../useMatchKey'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'

export type PointMatchProps = {
    gameConf?: GameConf
    matchLength?: number
    matchScore?: Score
    isCrawford?: boolean
    board?: GameSetup
    cbConfs?: CubefulGameConfs
    autoOperators: { cb: CBOperator; sg: SGOperator }
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
        autoOperators = { cb: undefined, sg: undefined },
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

    const initialMatchState =
        matchLength === 0
            ? matchStateForUnlimitedMatch(curScore, gameConf.jacobyRule, isCrawford)
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
                matchRecordInPlay<BGState>(
                    gameConf,initialMatchState
                )
            )
        )
    const onResumeState = (index: number) => {
        const resumed = matchRecorder.resumeTo(index)
        setCBState(resumed.cbState)
        setSGState(resumed.sgState)
    }

    const { handlers } = cubefulGameEventHandlers(
        matchRecord.matchState.isCrawford,
        defaultBGState(gameConf),
        setSGState,
        setCBState,
        rollListener,

        matchKeyAddOn,
        matchRecorderAddOn
    )

    const recordedMatchProps: RecordedCubefulGameProps = {
        gameConf,
        matchRecord,
        bgState: { sgState, cbState },
        cbConfs,
        autoOperators,
        ...{ ...handlers, onResumeState },
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
