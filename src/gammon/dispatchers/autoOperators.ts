import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { CBOperator } from '../components/CubefulGameBoard'
import { SGOperator } from '../components/SingleGameBoard'
import { CubeGameDispatcher } from './CubeGameDispatcher'
import { CBAction, CBResponse } from './CubeGameState'
import { SGToRoll } from './SingleGameState'

const defaultEngine: GammonEngine = simpleNNEngine
export const doNothingOperator: SGOperator = {
    operateCheckerPlayRed: () => false,
    operateCheckerPlayWhite: () => false,
    operateRollRed: () => false,
    operateRollWhite: () => false,
}

const doCheckerPlay =
    (engine: GammonEngine) =>
    (
        doCommitCheckerPlay: (nextNode: BoardStateNode) => void,
        boardStateNode: BoardStateNode,
    ) => {
        doCommitCheckerPlay(engine.checkerPlay(boardStateNode))
        return true
    }

// 単に受け取ったdoRoll関数をそのまま実行する
const executeDoRoll = (doRoll: () => void) => {
    doRoll()
    return true
}

export function redSGAutoOperator(
    engine: GammonEngine = defaultEngine
): SGOperator {
    return {
        ...doNothingOperator,
        operateCheckerPlayRed: doCheckerPlay(engine),
        operateRollRed: executeDoRoll,
    }
}

export function whiteSGAutoOperator(
    engine: GammonEngine = defaultEngine
): SGOperator {
    return {
        ...doNothingOperator,
        operateCheckerPlayWhite: doCheckerPlay(engine),
        operateRollWhite: executeDoRoll,
    }
}

export function bothSGAutoOperator(
    engine: GammonEngine = defaultEngine
): SGOperator {
    return {
        operateCheckerPlayRed: doCheckerPlay(engine),
        operateCheckerPlayWhite: doCheckerPlay(engine),
        operateRollRed: executeDoRoll,
        operateRollWhite: executeDoRoll,
    }
}

export function redCBAutoOperator(engine?: GammonEngine): CBOperator {
    return cbAutoOperator(engine, (state: { isRed: boolean }) => state.isRed)
}

export function whiteCBAutoOperator(engine?: GammonEngine): CBOperator {
    return cbAutoOperator(engine, (state: { isRed: boolean }) => !state.isRed)
}

export function bothCBAutoOperator(engine?: GammonEngine): CBOperator {
    return cbAutoOperator(engine, () => true)
}

function cbAutoOperator(
    engine: GammonEngine | undefined = defaultEngine,
    isInPlay: (state: { isRed: boolean }) => boolean
): CBOperator {
    return {
        operateCubeAction: (
            cbDispatcher: CubeGameDispatcher,
            cbState: CBAction,
            sgState: SGToRoll
        ) => {
            if (isInPlay(cbState)) {
                if (
                    engine.cubeAction(sgState.boardState, cbState.cubeState)
                        .isDouble
                ) {
                    cbDispatcher.doDouble(cbState)
                } else {
                    cbDispatcher.doSkipCubeAction(cbState)
                }
                return true
            }
            return false
        },
        operateCubeResponse: (
            cbDispatcher: CubeGameDispatcher,
            cbState: CBResponse,
            sgState: SGToRoll
        ): boolean => {
            if (isInPlay(cbState)) {
                if (
                    engine.cubeResponse(sgState.boardState, cbState.cubeState)
                        .isTake
                ) {
                    cbDispatcher.doTake(cbState)
                } else {
                    cbDispatcher.doPass(cbState)
                }
                return true
            }
            return false
        },
    }
}
