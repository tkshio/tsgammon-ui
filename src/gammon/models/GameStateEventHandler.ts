import {GameStatePrivate, StateBuilder} from "./GameState";
import {Player} from "./Player";
import {buildNodes, nodeWithBlankDice} from "./BoardStateNode";
import {Dices} from "./Dices";
import {CubeOwner} from "./CubeState";
import {eog} from "./BoardState";

export interface EventHandler<STATE> {
    doAwaitOpeningRoll(state: STATE): STATE;

    doOpeningRoll(state: STATE, roll: Dices): STATE;

    doRoll(state: STATE, player: Player, dices: Dices): STATE;

    doAwaitRoll(state: STATE, player: Player): STATE;

    doCheckerPlay(state: STATE, player: Player, pos: number, useMinorFirst?: boolean): STATE;

    doCommits(state: STATE, player: Player): STATE;

    doRevert(state: STATE, player: Player): STATE;

    doDouble(state: STATE, player: Player): STATE;

    doPass(state: STATE, player: Player): STATE;

    doTake(state: STATE, player: Player): STATE;

    doRestart(state: STATE): STATE;
}

export function buildEventHandler(stateBuilder: StateBuilder): EventHandler<GameStatePrivate> {
    return {
        doAwaitOpeningRoll(state: GameStatePrivate): GameStatePrivate {
            return stateBuilder.buildAwaitOpeningRollStatus(state)
        },
        doOpeningRoll(state: GameStatePrivate, dices: Dices): GameStatePrivate {
            const isRedPlayerFirst = dices[0].pip > dices[1].pip
            const player = isRedPlayerFirst ? state.whitePlayer.opponent() : state.whitePlayer
            const boardToPlay = isRedPlayerFirst ? state.board().revert() : state.nodes.board
            const nodes = buildNodes(boardToPlay, dices[0], dices[1]);

            return stateBuilder.buildCheckerPlayStatus(state, player, nodes)
        },

        doAwaitRoll(state: GameStatePrivate, player: Player): GameStatePrivate {
            return stateBuilder.buildAwaitRollStatus(state, player)
        },
        doRoll(state: GameStatePrivate, player: Player, dices: Dices): GameStatePrivate {
            const board = state.board().revert()
            const nodes = buildNodes(board, dices[0], dices[1])

            return stateBuilder.buildCheckerPlayStatus(state, player, nodes)
        },

        doCheckerPlay(state: GameStatePrivate, player: Player, absPos: number, useMinorFirst?: boolean): GameStatePrivate {
            const pos = player.makeAbsolutePos(state.board(), absPos)

            // ダイスの順序が小<大の時は、小を先に使うパターンから調べる
            // それ以外は大を優先から調べればよい
            const nodesAfterMove =
                useMinorFirst ?
                    (state.nodes.minorFirst(pos).hasValue ?
                        state.nodes.minorFirst(pos) :
                        state.nodes.majorFirst(pos)) :
                    (state.nodes.majorFirst(pos).hasValue ?
                        state.nodes.majorFirst(pos) :
                        state.nodes.minorFirst(pos))


            // 手がなければ、このposのポイントから動かせる駒はない
            return nodesAfterMove.hasValue ?
                stateBuilder.buildCheckerPlayStatus(state, player, nodesAfterMove, state.baseNodes) :
                state
        },

        doCommits(state: GameStatePrivate, player: Player): GameStatePrivate {
            const eog = state.board().eogStatus()
            if (eog.isEndOfGame) {

                const cubeValue = state.cube?.value ?? 1
                const stakeValue = eog.calcStake(cubeValue, state.conf.jacobyRule)
                const stake = player.stake(stakeValue)

                console.log(`${player.side === CubeOwner.WHITE ? "White" : "Red"} wins`,
                    `cube:${cubeValue}`, `stake:${stakeValue}`
                )

                return stateBuilder.buildEndOfGameStatus(state, stake, eog)
            }

            const opponentPlayer = player.opponent()
            const nextNode = nodeWithBlankDice(state.board())
            const nextState: GameStatePrivate = {
                ...state,
                nodes: nextNode,
                baseNodes: nextNode,
                curPlay: {moves: [], dices: []},
                prevPlay: state.curPlay
            }
            if ((state.cube?.owner === player.side) ||
                state.cube?.isMax() ||
                state.conf.cubeMax === 1
            ) {
                return stateBuilder.buildAwaitRollStatus(nextState, opponentPlayer);
            }

            return stateBuilder.buildCubeActionStatus(nextState, opponentPlayer);
        },
        doRevert(state: GameStatePrivate, player: Player): GameStatePrivate {
            return stateBuilder.buildCheckerPlayStatus(state, player, state.baseNodes)
        },
        doDouble(state: GameStatePrivate, player: Player): GameStatePrivate {
            return stateBuilder.buildCubeResponseStatus(state, player.opponent());
        },
        doTake(state: GameStatePrivate, player: Player): GameStatePrivate {
            const opponentPlayer = player.opponent()
            const cube = state.cube?.double(player.side)

            const nextState = {...state, cube: cube}

            return stateBuilder.buildAwaitRollStatus(nextState, opponentPlayer)
        },
        doPass(state: GameStatePrivate, player: Player): GameStatePrivate {
            const opponent = player.opponent()
            const scoreToAdd = state.cube?.value ?? 1
            const stake = opponent.stake(scoreToAdd)
            return stateBuilder.buildEndOfGameStatus(state, stake, eog({isEndOfGame: true}));
        },
        doRestart(state: GameStatePrivate): GameStatePrivate {
            return stateBuilder.buildRestartedStatus(state)
        }
    }

}