import { BoardState, CubeState } from 'tsgammon-core'
import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { CBOperator } from '../components/CubefulGameBoard'
import { SGOperator } from '../components/SingleGameBoard'

const defaultEngine: GammonEngine = simpleNNEngine

const doCheckerPlay =
    (engine: GammonEngine) =>
    (
        doCommitCheckerPlay: (nextNode: BoardStateNode) => void,
        boardStateNode: BoardStateNode
    ) => {
        doCommitCheckerPlay(engine.checkerPlay(boardStateNode))
        return true
    }

// 単に受け取ったdoRoll関数をそのまま実行する
const doDoRoll = (doRoll: () => void) => {
    doRoll()
    return true
}

export function redSGAutoOperator(
    engine: GammonEngine = defaultEngine
): SGOperator {
    return {
        operateCheckerPlayRed: doCheckerPlay(engine),
        operateRollRed: doDoRoll,
        operateCheckerPlayWhite: () => false,
        operateRollWhite: () => false,
    }
}

export function whiteSGAutoOperator(
    engine: GammonEngine = defaultEngine
): SGOperator {
    return {
        operateCheckerPlayRed: () => false,
        operateRollRed: () => false,
        operateCheckerPlayWhite: doCheckerPlay(engine),
        operateRollWhite: doDoRoll,
    }
}

export function bothSGAutoOperator(
    engine: GammonEngine = defaultEngine
): SGOperator {
    return {
        operateCheckerPlayRed: doCheckerPlay(engine),
        operateCheckerPlayWhite: doCheckerPlay(engine),
        operateRollRed: doDoRoll,
        operateRollWhite: doDoRoll,
    }
}

function doCubeAction(engine: GammonEngine | undefined = defaultEngine) {
    return (
        cubeState: CubeState,
        boardState: BoardState,
        doDouble: () => void,
        doSkipCubeAction: () => void
    ) => {
        if (engine.cubeAction(boardState, cubeState).isDouble) {
            doDouble()
        } else {
            doSkipCubeAction()
        }
        return true
    }
}

function doCubeResponse(engine: GammonEngine | undefined = defaultEngine) {
    return (
        cubeState: CubeState,
        boardState: BoardState,
        doTake: () => void,
        doPass: () => void
    ): boolean => {
        if (engine.cubeResponse(boardState, cubeState).isTake) {
            doTake()
        } else {
            doPass()
        }
        return true
    }
}

export function redCBAutoOperator(engine?: GammonEngine): CBOperator {
    return {
        operateRedCubeAction: doCubeAction(engine),
        operateRedCubeResponse: doCubeResponse(engine),
        operateWhiteCubeAction: () => false,
        operateWhiteCubeResponse: () => false,
    }
}

export function whiteCBAutoOperator(engine?: GammonEngine): CBOperator {
    return {
        operateRedCubeAction: () => false,
        operateRedCubeResponse: () => false,
        operateWhiteCubeAction: doCubeAction(engine),
        operateWhiteCubeResponse: doCubeResponse(engine),
    }
}

export function bothCBAutoOperator(engine?: GammonEngine): CBOperator {
    return {
        operateRedCubeAction: doCubeAction(engine),
        operateRedCubeResponse: doCubeResponse(engine),
        operateWhiteCubeAction: doCubeAction(engine),
        operateWhiteCubeResponse: doCubeResponse(engine),
    }
}
