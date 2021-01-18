import {BoardState, countRedPieces, countWhitePieces, eog, EOGStatus, initBoardState} from "./BoardState";
import {BoardStateNode, buildNodes, collectMoves, Move, nodeWithBlankDice} from "./BoardStateNode";
import {AbsoluteBoardState, standard} from "./AbsoluteBoardState";
import {Player, whitePlayer} from "./Player";
import {cube, CubeState, CubeValue} from "./CubeState";
import {gameStatus, GameStatus} from "./GameStatus";
import {buildStateReducers} from "./GameStateReducers";
import {buildEventHandler} from "./GameStateEventHandler";
import {DicePip, Dices} from "./Dices";
import {Score, score} from "./Score";
import {AbsoluteMove} from "./AbsoluteMove";

/**
 * ゲームの任意の局面を表す
 */
export type GameState = {
    conf: GameConf
    status: GameStatus
    cube?: CubeState
    reduce: (...messages: GammonMessage[]) => GameState
    board(): BoardState
    absoluteBoard(): AbsoluteBoardState
    dices(): Dices
    hasMoved(): boolean
    moves(): AbsoluteMove[][]
    curPlay: Ply
    prevPlay: Ply
    stake: Score
    eogStatus(): EOGStatus
}

/**
 * 駒配置、ルールなどの定義
 */
export type GameConf = {
    /**
     * 初期配置は、対局開始時の駒配置を示すとともに、駒の総数の算出の基礎としても使用される
     */
    initialArrangement: number[],
    /**
     * cubeMaxに達するとダブルできなくなる。すなわち、cubeMaxが512なら、キューブは512にまで上がる可能性があり、
     * 1024には上がらない。
     */
    cubeMax?: CubeValue
    jacobyRule: boolean
}

export const standardConf: GameConf = {
    initialArrangement: standard,
    jacobyRule: true
}

export type GammonMessageMove =
    { type: "Move", pos: number, useMinorFirst?: boolean }

export type GammonMessage =
    { type: "StartGame" } |
    { type: "Double" } |
    { type: "AwaitRoll" } |
    { type: "Roll", roll: Dices } |
    { type: "Take" } |
    { type: "Pass" } |
    GammonMessageMove |
    { type: "Revert" } |
    { type: "Commit", force?: boolean } |
    { type: "Restart" } |
    { type: "NOOP" }

export type Ply = {
    moves: AbsoluteMove[]
    dices: Dices
}

export type GameStatePrivate = GameState & {
    nodes: BoardStateNode
    baseNodes: BoardStateNode
    whitePlayer: Player
}

/**
 * 任意の局面をプログラマブルに生成するBuilderインターフェース
 */
export interface InitialStateBuilder {
    buildOpeningStatus(conf?: GameConf, pieces?: number[], cubeState?: CubeState): GameState

    buildCubeActionStatus(conf?: GameConf, pieces?: number[], cubeState?: CubeState, isWhite?: boolean): GameState


    buildCubeResponseStatus(cubeState: CubeState, conf?: GameConf, pieces?: number[], isWhite?: boolean): GameState


    buildCheckerPlayStatus(dice0: DicePip, dice1: DicePip, conf?: GameConf, pieces?: number[], cubeState?: CubeState, isWhite?: boolean): GameState

    buildEndOfGameStatus(conf?: GameConf, pieces?: number[], cubeState?: CubeState, stake?: Score, eogStatus?: EOGStatus): GameState
}


/**
 * GGameStateEventHandlersが、メッセージの処理結果について新しい状態を生成して状態遷移するために使用するインターフェース
 */
export interface StateBuilder {
    initGameState(conf?: GameConf, initialArrangement?: number[], cubeState?: CubeState): GameStatePrivate;

    buildAwaitOpeningRollStatus(state: GameStatePrivate): GameStatePrivate;

    buildAwaitRollStatus(nextState: GameStatePrivate, opponentPlayer: Player): GameStatePrivate;

    buildCubeActionStatus(nextState: GameStatePrivate, opponentPlayer: Player): GameStatePrivate;

    buildCubeResponseStatus(state: GameStatePrivate, player1: Player): GameStatePrivate;

    buildCheckerPlayStatus(state: GameStatePrivate, player: Player, nodesAfterMove: BoardStateNode, baseNodes?: BoardStateNode): GameStatePrivate;

    buildEndOfGameStatus(state: GameStatePrivate, stake: Score, eogStatus: EOGStatus): GameStatePrivate;

    buildRestartedStatus(state: GameStatePrivate): GameStatePrivate;
}

/**
 * StateBuilderの実装、GameStateオブジェクトの生成に責任を負う
 */
export const stateBuilder: StateBuilder = {
    initGameState(conf: GameConf = {
                      initialArrangement: standard,
                      cubeMax: 512,
                      jacobyRule: true
                  },
                  pieces: number[] = conf.initialArrangement,
                  cubeValue: CubeState = cube(1, undefined, conf.cubeMax),
    ): GameStatePrivate {
        const bornOffs = countBornOffs(pieces, conf.initialArrangement)
        const initialBoardState = initBoardState(pieces, bornOffs)
        const emptyNode = nodeWithBlankDice(initialBoardState)
        const absoluteBoard = whitePlayer.makeAbsoluteBoard(initialBoardState)
        const eventHandler = buildEventHandler(stateBuilder)
        const reducers = buildStateReducers(eventHandler, whitePlayer)

        return {
            conf: conf,
            status: gameStatus.initialized,
            dices() {
                return this.nodes.dices
            },
            hasMoved() {
                return this.nodes !== this.baseNodes
            },
            moves() {
                return []
            },
            curPlay: {moves: [], dices: []},
            prevPlay: {moves: [], dices: []},
            cube: cubeValue,
            reduce(...messages) {
                let nextState = this;
                for (const message in messages) {
                    const reducer = nextState.status.accept(reducers)
                    nextState = reducer(nextState, messages[message])
                }
                return nextState
            },
            absoluteBoard: () => absoluteBoard,
            stake: score(),
            eogStatus() {
                return this.board().eogStatus()
            },
            board() {
                return this.nodes.board
            },
            nodes: emptyNode,
            baseNodes: emptyNode,
            whitePlayer: whitePlayer,

        };

        function countBornOffs(pieces: number[], initialArrangement: number[]): [number, number] {
            const whiteNotBornOff = countWhitePieces(pieces)
            const redNotBornOff = countRedPieces(pieces)
            const whiteSum = countWhitePieces(initialArrangement)
            const redSum = countRedPieces(initialArrangement)

            return [whiteSum - whiteNotBornOff, redSum - redNotBornOff]
        }
    },

    buildAwaitOpeningRollStatus(state: GameStatePrivate): GameStatePrivate {
        return {
            ...state,
            status: gameStatus.rollOpening,
        }
    },

    buildAwaitRollStatus(state: GameStatePrivate, player: Player): GameStatePrivate {
        return {
            ...state,
            status: player.rollDice,
        }
    },

    buildCubeActionStatus(state: GameStatePrivate, player: Player): GameStatePrivate {
        return {
            ...state,
            status: player.cubeAction,
        }
    },

    buildCubeResponseStatus(state: GameStatePrivate, player: Player): GameStatePrivate {
        return {
            ...state,
            status: player.cubeResponse,
        }
    },

    /**
     * ムーブ中の状態を生成する
     * @param state ムーブ前の状態
     * @param player 手番プレイヤー
     * @param nodes ムーブ後の状態
     * @param baseNodes ムーブ後、アンドゥで戻る状態。手番開始時、アンドゥ時は省略可能で、その場合nodesが適用される
     */
    buildCheckerPlayStatus(state: GameStatePrivate, player: Player, nodes: BoardStateNode, baseNodes?: BoardStateNode): GameStatePrivate {
        const absoluteBoard = () => player.makeAbsoluteBoard(nodes.board)
        const moves = collectMoves(nodes).map(moves => moves.map(makeMoveAbsolute(nodes.board, player)))
        const curPlay = {
            moves: nodes.lastMoves().map(makeMoveAbsolute(nodes.board, player)),
            dices: (baseNodes ?? nodes).dices
        }

        if (pickupUnusedDices(nodes.dices)) {
            // まだ未使用ダイスが残っていれば、ムーブ中が継続
            return {
                ...state,
                status: player.checkerPlay,
                nodes: nodes,
                baseNodes: baseNodes ?? nodes,
                absoluteBoard: absoluteBoard,
                moves: () => moves,
                curPlay: curPlay
            }
        } else {
            // ダイスがすべて使い切られていれば、コミット待ち
            return {
                ...state,
                status: player.commitCheckerPlay,
                nodes: nodes,
                baseNodes: baseNodes ?? nodes,
                absoluteBoard: absoluteBoard,
                curPlay: curPlay
            }
        }

        // 設定の有無によらず、必要な座標はあらかじめ変換してしまう
        function makeMoveAbsolute(board: BoardState, player: Player): (move: Move) => AbsoluteMove {
            return (move) => {
                const fromDec = board.invertPos(move.from)
                const toDec = board.invertPos(move.to)
                const fromAbs = player.makeAbsolutePos(board, move.from)
                const toAbs = player.makeAbsolutePos(board, move.to)
                return {
                    fromAbs: fromAbs,
                    toAbs: toAbs,
                    fromAbsInv: board.invertPos(fromAbs),
                    toAbsInv: board.invertPos(toAbs),
                    fromAsc: move.from,
                    toAsc: move.to,
                    fromDec: fromDec,
                    toDec: toDec,
                    pip: move.pip,
                    isBearOff: toDec <= 0,
                    isReenter: move.from === 0,
                    isHit: move.isHit
                }
            }
        }

        function pickupUnusedDices(dices: Dices): Dices | undefined {
            const unused = dices.filter(d => !d.used)
            return unused.length === 0 ? undefined : unused
        }
    },

    buildEndOfGameStatus(state: GameStatePrivate, stake: Score, eogStatus: EOGStatus): GameStatePrivate {
        return {
            ...state,
            status: gameStatus.endOfGame,
            stake: stake,
            eogStatus(): EOGStatus {
                return eogStatus // state.board().eogStatus()とは限らない（Passなど）
            }
        }
    },

    buildRestartedStatus(state: GameStatePrivate): GameStatePrivate {
        const conf = state.conf
        return stateBuilder.initGameState(conf,
            conf.initialArrangement,
            cube(1, undefined, conf.cubeMax))
    },

}

export const initialStateBuilder: InitialStateBuilder = {
    buildCheckerPlayStatus(dice0: DicePip, dice1: DicePip, conf?: GameConf, pieces?: number[], cubeState?: CubeState, isWhite: boolean = true): GameState {
        const initialState = stateBuilder.initGameState(conf, pieces, cubeState);
        const player = isWhite ? initialState.whitePlayer : initialState.whitePlayer.opponent()

        const board = isWhite ? initialState.board() : initialState.board().revert()
        const nodes = buildNodes(board, dice0, dice1)
        return stateBuilder.buildCheckerPlayStatus(initialState, player, nodes)
    },
    buildCubeActionStatus(conf?: GameConf, pieces?: number[], cubeState?: CubeState, isWhite: boolean = true): GameState {
        const initialState = stateBuilder.initGameState(conf, pieces, cubeState);
        const player = isWhite ? initialState.whitePlayer : initialState.whitePlayer.opponent()

        return stateBuilder.buildCubeActionStatus(initialState, player)
    },
    buildCubeResponseStatus(cubeState: CubeState, conf?: GameConf, pieces?: number[], isWhite: boolean = true): GameState {
        const initialState = stateBuilder.initGameState(conf, pieces, cubeState);
        const player = isWhite ? initialState.whitePlayer : initialState.whitePlayer.opponent()

        return stateBuilder.buildCubeResponseStatus(initialState, player)
    },
    buildEndOfGameStatus(conf?: GameConf, pieces?: number[], cubeState?: CubeState, stake?: Score, eogStatus?: EOGStatus): GameState {
        const initialState = stateBuilder.initGameState(conf, pieces, cubeState);
        return stateBuilder.buildEndOfGameStatus(initialState, stake ?? score(), eogStatus ?? eog({isEndOfGame: true}))
    },
    buildOpeningStatus(conf?: GameConf, pieces?: number[], cubeState?: CubeState): GameState {
        const initialState = stateBuilder.initGameState(conf, pieces, cubeState);
        const eventHandler = buildEventHandler(stateBuilder)
        return eventHandler.doAwaitOpeningRoll(initialState)
    }
}