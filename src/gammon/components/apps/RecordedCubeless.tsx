import { buildSGEventHandler } from 'tsgammon-core/dispatchers/buildSGEventHandler'
import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'

import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { operateWithSG } from '../operateWithSG'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import {
    RecordedSingleGame,
    RecordedSingleGameProps
} from '../recordedGames/RecordedSingleGame'
import { useMatchRecorderForSingleGame } from '../recordedGames/useMatchRecorderForSingleGame'
import { useSingleGameState } from '../useSingleGameState'

import './main.css'

export type UnlimitedSingleGameProps = {
    gameConf?: GameConf
    state?: GameSetup
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
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
export function UnlimitedSingleGame(props: UnlimitedSingleGameProps) {
    const {
        gameConf = standardConf,
        state,
        autoOperators = {},
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
    } = props

    const initialSGState = toSGState(state)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const { handlers:_handlers, matchRecord } = useRecordedCubeless(
        gameConf,
        setSGState,
        rollListener
    )
    const handlers = operateWithSG( autoOperators.sg, _handlers)

    const recordedMatchProps: RecordedSingleGameProps = {
        sgState,
        matchRecord,
        ...handlers,
    }

    return <RecordedSingleGame {...recordedMatchProps} />
}

function useRecordedCubeless(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners()
) {
    const { matchRecord, matchRecorder, matchRecordAddOn } =
        useMatchRecorderForSingleGame(gameConf)
    const handlers = buildSGEventHandler(
        rollListener,
        setSGStateListener(defaultSGState(gameConf), setSGState)
    ).addListeners(matchRecordAddOn)
    return {
        handlers: {
            ...handlers,
            onResumeState: (index: number) => {
                const resumed = matchRecorder.resumeTo(index)
                setSGState(resumed.state)
            },
        },
        matchRecord,
    }
}
