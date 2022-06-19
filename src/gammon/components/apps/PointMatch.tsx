import { CubeState, score, Score } from 'tsgammon-core'
import { BGState, toState } from 'tsgammon-core/dispatchers/BGState'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    matchStateForPointMatch,
    matchStateForUnlimitedMatch,
} from 'tsgammon-core/dispatchers/MatchState'
import { ResignOffer, RSOffered } from 'tsgammon-core/dispatchers/ResignState'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
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
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { useMatchRecorderForCubeGame } from '../recordedGames/useMatchRecorderForCubeGame'
import { OperationConfs } from '../SingleGameBoard'
import { ResignStateInChoose } from '../uiparts/ResignDialog'
import { useCBAutoOperatorWithRS } from '../useCBAutoOperatorWithRS'
import { useCubeGameState } from '../useCubeGameState'
import { useMatchKey } from '../useMatchKey'
import {
    MayResignOrNot,
    ResignEventHandlers,
    useResignState,
} from '../useResignState'
import { useSingleGameState } from '../useSingleGameState'
import './main.css'

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

    // 降参機能
    const mayResign = mayResignOrNot(cbState)
    const { resignState, resignStateAddOn, resignEventHandlers } =
        useResignState(cbState.cubeState, mayResign, autoOperators)

    const { handlers } = cubefulGameEventHandlers(
        matchRecord.matchState.isCrawford,
        defaultBGState(gameConf),
        setSGState,
        setCBState,
        rollListener,

        matchKeyAddOn,
        matchRecorderAddOn,
        resignStateAddOn
    )

    useCBAutoOperatorWithRS(
        resignState,
        cbState,
        sgState,
        autoOperators,
        handlers
    )

    const recordedMatchProps: RecordedCubefulGameProps = {
        resignState,
        matchRecord,
        bgState: { sgState, cbState },
        opConfs,
        ...handlers,
        ...addRSOperator(
            cbState.cubeState,
            sgState,
            autoOperators.rs,
            resignEventHandlers((result, eogStatus) =>
                handlers.onEndGame?.({ sgState, cbState }, result, eogStatus)
            )
        ),
        onResumeState,
    }

    return <RecordedCubefulGame key={matchKey} {...recordedMatchProps} />
}

function addRSOperator(
    cubeState: CubeState,
    sgState: SGState,
    rs: RSOperator | undefined,
    handlers: ResignEventHandlers
): ResignEventHandlers {
    if (rs === undefined) {
        return handlers
    }

    const onOfferResign = (
        resignState: ResignStateInChoose,
        offer: ResignOffer
    ) => {
        const offered = handlers.onOfferResign(resignState, offer)
        if (offered) {
            const { boardState, node } = toBoardState(sgState)
            return rs[
                offered.isRed
                    ? 'operateRedResignResponse'
                    : 'operateWhiteResignResponse'
            ](
                offered.offer,
                () => {
                    handlers.onAcceptResign(offered)
                },
                () => {
                    onRejectResign(offered)
                },
                cubeState,
                boardState,
                node
            )
                ? undefined // rsOperatorが対処したなら、それ以上は何もしない
                : offered // 実際のところ、何か値を返しても特に使途はない
        }
        return undefined
    }
    const onRejectResign = (resignState: RSOffered) => {
        const rejected = handlers.onRejectResign(resignState)
        if (rejected) {
            const { boardState, node } = toBoardState(sgState)
            rs[
                rejected.isRed
                    ? 'operateRedOfferAction'
                    : 'operateWhiteOfferAction'
            ](
                (offer: ResignOffer) => {
                    onOfferResign(rejected, offer)
                },
                rejected.lastOffer,
                cubeState,
                boardState,
                node
            )
            return rejected
        }
    }
    return {
        ...handlers,
        onOfferResign,
        onRejectResign,
    }

    function toBoardState(sgState: SGState) {
        return {
            boardState: sgState.boardState,

            node:
                sgState.tag === 'SGInPlay' ? sgState.boardStateNode : undefined,
        }
    }
}

export function mayResignOrNot(cbState: CBState): MayResignOrNot {
    return cbState.tag === 'CBAction' ||
        cbState.tag === 'CBInPlay' ||
        cbState.tag === 'CBToRoll'
        ? { mayResign: true, isRed: cbState.isRed }
        : { mayResign: false, isRed: undefined }
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
