import { useState } from 'react'
import { DiceRoll } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGOpening, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { score, Score } from 'tsgammon-core/Score'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
    SingleGameEventHandlers,
} from '../SingleGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useSingleGameListeners } from '../useSingleGameListeners'

export type SingleGameProps = {
    gameConf?: GameConf
    sgConfs?: SingleGameConfs
} & GameSetup &
    Partial<
        SingleGameListeners &
            RollListener &
            CheckerPlayListeners &
            BoardEventHandlers
    >

export function SingleGame(props: SingleGameProps) {
    const { gameConf = standardConf, sgConfs, ...state } = props
    const initialSGState = toSGState(state)
    const [sgState, sgListeners, setSGState] = useSingleGameListeners(
        initialSGState,
        {
            onStartCheckerPlay: (next) => {console.log(next)},
        }
    )
    const [cpState, cpListeners] = useCheckerPlayListeners()
    console.log(cpListeners)
    const [gameScore, setGameScore] = useState(score())

    const dialog =
        sgState.tag === 'SGEoG' ? (
            <EOGDialog
                {...{
                    stake: sgState.stake,
                    eogStatus: sgState.eogStatus,
                    score: gameScore.add(sgState.stake),
                    onClick: () => {
                        doReset(gameScore.add(sgState.stake))
                    },
                }}
            />
        ) : undefined
    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })
    function sgEH(dispatcher: SingleGameDispatcher): SingleGameEventHandlers {
        return {
            onCommit: (state, node) => {
                const n = dispatcher.doCommitCheckerPlay(state, node)
                console.log(state, n)
            },
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
        singleGameDispatcher(sgListeners)
    )
    const sgProps: SingleGameBoardProps = {
        ...props,
        sgState,
        cpState,
        sgConfs,
        dialog,
        ...singleGameEventHandlers,
        ...cpListeners,
    }

    function doReset(scoreAfter: Score) {
        const state = toSGState({ absPos: gameConf.initialPos })
        setSGState(state)
        setGameScore(scoreAfter)
    }

    return <SingleGameBoard {...sgProps} />
}
