import { EOGStatus, score, Score } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { buildBGEventHandler } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import { eogEventHandler } from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { shouldSkipCubeAction } from 'tsgammon-core/MatchState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../CubefulGame'
import { operateWithBGandRS } from '../operateWithRS'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedCubefulGame,
    RecordedCubefulGameProps,
} from '../recordedGames/RecordedCubefulGame'
import { defaultPlayersConf, PlayersConf } from '../PlayersConf'
import { useBGState } from '../useBGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useGameKey } from '../useGameKey'
import { useResignState } from '../useResignState'
import { useBGRecorder } from '../useBGRecorder'

export type CubefulMatchProps = {
    gameConf?: GameConf
    playersConf?: PlayersConf
    gameSetup?: GameSetup
    autoOperators?: { cb: CBOperator; sg: SGOperator; rs?: RSOperator }
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
    onEndOfMatch?: () => void
    dialog?: JSX.Element
    matchLength: number
    recordMatch?: boolean
    isCrawford?: boolean
    matchScore?: Score
} & Partial<RollListener & BGListener>

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function CubefulMatch(props: CubefulMatchProps) {
    const {
        gameConf = standardConf,
        autoOperators = { cb: undefined, sg: undefined, rs: undefined },
        playersConf = defaultPlayersConf,
        gameSetup,
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
        onEndOfMatch = () => {
            //
        },
        dialog,
        matchLength,
        isCrawford = false,
        matchScore = score(),
        recordMatch = false,
    } = props
    const bgRecorder = useBGRecorder(
        gameConf,
        matchLength,
        matchScore,
        isCrawford
    )(recordMatch)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })

    const { matchState, matchListener } = bgRecorder
    // 盤面の指定があれば、そこから開始
    const initialBGState = toState(gameSetup, gameConf)

    // 状態管理
    const { bgState, setBGState } = useBGState(initialBGState)
    // チェッカープレイ中の状態管理は、記録なしの時にのみ使用
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined)

    // 1ゲームごとにユニークなKeyを採番する
    const { gameKey, gameKeyAddOn } = useGameKey()

    const listeners: Partial<BGListener>[] = [
        setBGStateListener(defaultBGState(gameConf), setBGState),
        gameKeyAddOn,
        matchListener,
    ]

    // 降参機能
    const { resignState, rsDialogHandler: rsHandler } = useResignState(
        (result: SGResult, eog: EOGStatus) =>
            eogEventHandler(...listeners).onEndOfBGGame(bgState, result, eog)
    )

    // キューブありのゲームの進行管理
    const skipCubeAction =
        bgState.cbState.tag === 'CBInPlay' &&
        shouldSkipCubeAction(
            matchState,
            bgState.cbState.cubeState.value,
            // skipCubeActionが意味を持つのは、実質的にはコミット直前の時だけで、
            // その時点ではまだ相手の手番なので、自分のスコアを基準に判定するためには
            // 反転させる必要がある
            !bgState.cbState.isRed
        )
    const _bgEventHandlers = buildBGEventHandler(
        skipCubeAction,
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

    const cbProps = {
        resignState,
        playersConf,
        bgState,
        ...bgEventHandler,
        ...rsDialogHandler,
        onEndOfMatch,
        dialog,
    }

    if (bgRecorder.recordMatch) {
        // 記録された状態からの復元
        const onResumeState = (index: number) => {
            const { state } = bgRecorder.matchRecorder.resumeTo(index)
            setBGState(state)
            // ここでautoOperationも実行しないといけないが、手を変更できたほうが便利だろう
        }

        const recordedMatchProps: RecordedCubefulGameProps = {
            ...cbProps,
            matchRecord: bgRecorder.matchRecord,
            onResumeState,
        }

        return <RecordedCubefulGame key={gameKey} {...recordedMatchProps} />
    } else {
        return (
            <div id="main">
                <div id="boardPane">
                    <CubefulGame
                        key={gameKey}
                        {...{ ...cbProps, matchState, cpState, ...cpListeners }}
                    />
                </div>
            </div>
        )
    }
}
