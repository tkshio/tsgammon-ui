import { boardState, eog } from 'tsgammon-core/BoardState'
import { nodeWithEmptyDice } from 'tsgammon-core/BoardStateNode'
import { cube, CubeState } from 'tsgammon-core/CubeState'
import { DicePip } from 'tsgammon-core/Dices'
import { standardConf } from 'tsgammon-core/GameConf'
import { Ply } from 'tsgammon-core/Ply'
import { Score } from 'tsgammon-core/Score'
import {
    cbActionRed,
    cbActionWhite,
    cbEoGRed,
    cbEoGWhite,
    cbInPlayRed,
    cbInPlayWhite,
    cbOpening,
    cbResponseRed,
    cbResponseWhite,
    CBState,
    cbToRollRed,
    cbToRollWhite,
} from '../CubeGameState'
import {
    eogStateRed,
    eogStateWhite,
    inPlayStateRed,
    inPlayStateWhite,
    openingState,
    SGState,
    toRollStateRed,
    toRollStateWhite,
} from '../SingleGameState'

export enum GameStatus {
    OPENING,
    INPLAY_RED,
    INPLAY_WHITE,
    CUBEACTION_RED,
    CUBEACTION_WHITE,
    CUBERESP_RED,
    CUBERESP_WHITE,
    TOROLL_RED,
    TOROLL_WHITE,
    EOG_REDWON,
    EOG_WHITEWON,
}

export type GameState =
    | {
          gameStatus?: GameStatus.OPENING
          absPos?: number[]
          cubeState?: CubeState
      }
    | {
          gameStatus:
              | GameStatus.TOROLL_RED
              | GameStatus.TOROLL_WHITE
              | GameStatus.CUBEACTION_RED
              | GameStatus.CUBEACTION_WHITE
              | GameStatus.CUBERESP_RED
              | GameStatus.CUBERESP_WHITE

          absPos: number[]
          cubeState?: CubeState
          lastPly?: Ply
      }
    | {
          gameStatus: GameStatus.EOG_REDWON | GameStatus.EOG_WHITEWON

          absPos: number[]
          stake: Score
          cubeState?: CubeState
          lastPly?: Ply
      }
    | {
          gameStatus: GameStatus.INPLAY_RED | GameStatus.INPLAY_WHITE

          dice1: DicePip
          dice2: DicePip
          absPos: number[]
          cubeState?: CubeState

          lastPly?: Ply
      }

export function toCBState(gameState: GameState = {}): CBState {
    const { gameStatus, cubeState = cube(1) } = gameState
    if (gameStatus === undefined) {
        return cbOpening(cubeState)
    }
    switch (gameStatus) {
        case GameStatus.OPENING:
            return cbOpening(cubeState)
        case GameStatus.INPLAY_RED:
            return cbInPlayRed(cubeState, 'Skip')
        case GameStatus.INPLAY_WHITE:
            return cbInPlayWhite(cubeState, 'Skip')
        case GameStatus.CUBEACTION_RED:
            return cbActionRed(cubeState)
        case GameStatus.CUBEACTION_WHITE:
            return cbActionWhite(cubeState)
        case GameStatus.CUBERESP_RED:
            return cbResponseRed(cubeState)
        case GameStatus.CUBERESP_WHITE:
            return cbResponseWhite(cubeState)
        case GameStatus.TOROLL_RED:
            return cbToRollRed(cubeState, 'Skip')
        case GameStatus.TOROLL_WHITE:
            return cbToRollWhite(cubeState, 'Skip')
        case GameStatus.EOG_REDWON:
            return cbEoGRed(cubeState, eog(), false)
        case GameStatus.EOG_WHITEWON:
            return cbEoGWhite(cubeState, eog(), false)
    }
}

export function toSGState(gameState: GameState = {}): SGState {
    if (gameState.gameStatus === undefined) {
        return openingState(
            boardState(gameState.absPos ?? standardConf.initialPos)
        )
    }
    switch (gameState.gameStatus) {
        case GameStatus.OPENING:
            return openingState(
                boardState(gameState.absPos ?? standardConf.initialPos)
            )
        case GameStatus.CUBEACTION_RED:
        case GameStatus.TOROLL_RED:
        case GameStatus.CUBERESP_WHITE: {
            const board = boardState(gameState.absPos)
            const lastStateNode = nodeWithEmptyDice(board)
            return toRollStateRed(
                lastStateNode.board.revert(),
                gameState.lastPly ?? { moves: [], dices: [], isRed: false },
                lastStateNode,
                lastStateNode
            )
        }
        case GameStatus.CUBEACTION_WHITE:
        case GameStatus.TOROLL_WHITE:
        case GameStatus.CUBERESP_RED: {
            const lastBoardState = boardState(gameState.absPos).revert()
            const lastStateNode = nodeWithEmptyDice(lastBoardState)
            return toRollStateWhite(
                lastStateNode.board.revert(),
                gameState.lastPly ?? { moves: [], dices: [], isRed: true },
                lastStateNode,
                lastStateNode
            )
        }
        case GameStatus.INPLAY_RED:
            return inPlayStateRed(
                boardState(gameState.absPos).revert(),
                gameState
            )
        case GameStatus.INPLAY_WHITE:
            return inPlayStateWhite(boardState(gameState.absPos), gameState)
        case GameStatus.EOG_REDWON: {
            const lastBoardState = boardState(gameState.absPos).revert()
            const lastStateNode = nodeWithEmptyDice(lastBoardState)
            return eogStateRed(
                1,
                gameState.lastPly ?? { moves: [], dices: [], isRed: false },
                lastStateNode,
                lastStateNode
            )
        }
        case GameStatus.EOG_WHITEWON: {
            const lastBoardState = boardState(gameState.absPos).revert()
            const lastStateNode = nodeWithEmptyDice(lastBoardState)
            return eogStateWhite(
                1,
                gameState.lastPly ?? { moves: [], dices: [], isRed: false },
                lastStateNode,
                lastStateNode
            )
        }
    }
}