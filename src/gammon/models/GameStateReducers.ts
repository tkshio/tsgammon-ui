import {Player} from "./Player";
import {DispatchOperator} from "./GameStatus";
import {GammonMessage} from "./GameState";
import {EventHandler} from "./GameStateEventHandler";


/**
 * 受け取ったメッセージを、状態・手番プレイヤーに応じて内部イベントとして解釈し、
 * EventHandlerによって新たな状態を返すオブジェクト、StateReducerを構築する
 * @param eventHandler
 * @param whitePlayer White担当のプレイヤー、そのopponentがRed担当のプレイヤーになる
 */
export function buildStateReducers<STATE>(eventHandler: EventHandler<STATE>,
                                          whitePlayer: Player):
    DispatchOperator<(state: STATE, message: GammonMessage) => STATE> {

    const redPlayer = whitePlayer.opponent()

    return {
        initialized() {
            return function (state: STATE, message: GammonMessage) {
                switch (message.type) {
                    case "StartGame":
                        return eventHandler.doAwaitOpeningRoll(state);
                    default:
                        return state;
                }
            };
        },
        rollOpening() {
            return function (state: STATE, message: GammonMessage) {
                switch (message.type) {
                    case "Roll":
                        return eventHandler.doOpeningRoll(state, message.roll);

                    default:
                        return state;
                }
            }
        },
        rollDiceRed() {
            return rollAction(redPlayer)
        },
        rollDiceWhite() {
            return rollAction(whitePlayer)
        },
        checkerPlayRed() {
            return checkerPlay(redPlayer)
        },
        checkerPlayWhite() {
            return checkerPlay(whitePlayer)
        },
        commitCheckerPlayRed() {
            return commitCheckerPlay(redPlayer)
        },
        commitCheckerPlayWhite() {
            return commitCheckerPlay(whitePlayer)
        },
        cubeActionRed() {
            return cubeAction(redPlayer)
        },
        cubeActionWhite() {
            return cubeAction(whitePlayer)
        },
        cubeResponseRed() {
            return cubeResponse(redPlayer)
        },
        cubeResponseWhite() {
            return cubeResponse(whitePlayer)
        },
        endOfGame() {
            return function (state: STATE, message: GammonMessage) {
                switch (message.type) {
                    case "Restart":
                        return eventHandler.doRestart(state)
                    default:
                        return state
                }
            };
        },
    }


    function commitCheckerPlay(player: Player) {
        return function (state: STATE, message: GammonMessage) {
            switch (message.type) {
                case "Commit":
                    return eventHandler.doCommits(state, player);
                case "Revert":
                    return eventHandler.doRevert(state, player);
                default:
                    return state;
            }
        };

    }

    function rollAction(player: Player) {
        return function (state: STATE, message: GammonMessage) {
            switch (message.type) {
                case "Roll":
                    return eventHandler.doRoll(state, player, message.roll);

                default:
                    return state;
            }

        }
    }

    function checkerPlay(player: Player) {
        return function (state: STATE, message: GammonMessage) {
            switch (message.type) {
                case "Move":
                    return eventHandler.doCheckerPlay(state, player, message.pos, message.useMinorFirst);
                case "Revert":
                    return eventHandler.doRevert(state, player);
                case "Commit":
                    return (message.force) ? eventHandler.doCommits(state, player) : state
                default:
                    return state;
            }
        }
    }

    function cubeAction(player: Player) {
        return function (state: STATE, message: GammonMessage) {
            switch (message.type) {
                case "Double":
                    return eventHandler.doDouble(state, player);

                case "AwaitRoll":
                    return eventHandler.doAwaitRoll(state, player);

                default:
                    return state;
            }
        }
    }

    function cubeResponse(player: Player) {
        return function (state: STATE, message: GammonMessage) {
            switch (message.type) {
                case "Pass":
                    return eventHandler.doPass(state, player);
                case "Take":
                    return eventHandler.doTake(state, player);
                // beaverの場合はeventHandler.doBeaver(){
                // 1. キューブを二倍に
                // 2. opponentを引数にbuildBeaverResponse=CubeResponse (beaver=false, racoon=true)
                // racoonの場合はさらにbuildRacoonResponse=CubeResponse(beaver=false, racoon=false)
                // }
                // みたいな実装をする（この間、cubeOwnerは変わらないことに注意）
                default:
                    return state;
            }
        }
    }
}