import {GameState, GammonMessage} from "./GameState";
import {BoardAction, BoardActionType} from "./BoardAction";
import {DispatchOperator} from "./GameStatus";
import {DiceSource, randomDiceSource} from "./DiceSource";
import {GammonEngine, randomEngine} from "../engines/GammonEngine";

/**
 * BoardAction、すなわちHTMLで構成された画面からのイベントを
 * GameStateへのメッセージに読み替えるためのインターフェース
 */
export type BoardOperator = (action: BoardAction) => DispatchOperator<GammonMessage>

/**
 * useEffect()内において、GameStateの状態に合わせてCPU側の処理を実施するためのインターフェース
 */
export type AutoOperator = (gameState: GameState, dispatcher: (_: GammonMessage[]) => void) => DispatchOperator<void>

/**
 * White/Red両者を自ら操作する場合のBoardOperator
 */
export function bothSideBoardOperator(): BoardOperator {
    return (action: BoardAction): DispatchOperator<GammonMessage> => {
        return {
            initialized: () => {
                return {type: 'StartGame'}
            },
            rollOpening: noop,
            endOfGame: noop,
            cubeActionWhite: () => cubeAction(action),
            cubeResponseRed: () => cubeResponse(action),
            rollDiceWhite: noop,
            rollDiceRed: noop,
            checkerPlayWhite: () => checkerPlay(action),
            commitCheckerPlayWhite: () => commitCheckerPlay(action),
            cubeActionRed: () => cubeAction(action),
            checkerPlayRed: () => checkerPlay(action),
            cubeResponseWhite: () => cubeResponse(action),
            commitCheckerPlayRed: () => commitCheckerPlay(action)
        };
    };
}

/**
 * White/Red両者を自ら操作する場合のAutoOperator、実質的にはダイスを振るのみ
 */
export function bothSideAutoOperator(diceSource: DiceSource = randomDiceSource()): AutoOperator {
    return (gameState: GameState, dispatcher: (messages: GammonMessage[]) => void): DispatchOperator<void> => {
        return {
            initialized: ignore,
            rollOpening: () => {
                const roll = diceSource.rollOpeningGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },
            endOfGame: ignore,
            cubeActionWhite: ignore,
            cubeResponseRed: ignore,
            rollDiceWhite: () => {
                const roll = diceSource.rollGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },
            rollDiceRed: () => {
                const roll = diceSource.rollGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },
            checkerPlayWhite: ignore,
            commitCheckerPlayWhite: ignore,
            cubeActionRed: ignore,
            checkerPlayRed: ignore,
            cubeResponseWhite: ignore,
            commitCheckerPlayRed: ignore
        }
    };
}

/**
 * 白側のみを操作する場合のBoardOperator
 * @param diceSource ダイス目の生成源
 */
export function whiteSideBoardOperator(diceSource: DiceSource = randomDiceSource()) {
    return (action: BoardAction): DispatchOperator<GammonMessage> => {
        return {
            initialized: () => {
                return {type: 'StartGame'}
            },
            rollOpening: noop,
            endOfGame: noop,
            cubeActionWhite: () => cubeAction(action),
            cubeResponseRed: () => awaitCubeResponse(action),
            rollDiceWhite: () => {
                const roll = diceSource.rollGammonDice()
                return {type: 'Roll', roll: roll}
            },
            rollDiceRed: () => {
                const roll = diceSource.rollGammonDice()
                return {type: 'Roll', roll: roll}
            },
            checkerPlayWhite: () => checkerPlay(action),
            commitCheckerPlayWhite: () => commitCheckerPlay(action),
            cubeActionRed: () => awaitCubeAction(action),
            checkerPlayRed: () => awaitCheckerPlay(action),
            cubeResponseWhite: () => cubeResponse(action),
            commitCheckerPlayRed: () => commitCheckerPlay(action)
        };
    };
}

/**
 * 白側のみを操作する場合のBoardOperator
 * @param diceSource ダイス目の生成源
 * @param engine 思考ルーチン
 */
export function whiteSideAutoOperator(engine: GammonEngine = randomEngine(),
                                      diceSource: DiceSource = randomDiceSource()) {
    return (gameState: GameState, dispatcher: (messages: GammonMessage[]) => void): DispatchOperator<void> => {
        return {
            initialized: () => {
                engine.initialized(gameState)
            },
            rollOpening: () => {
                const roll = diceSource.rollOpeningGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },
            endOfGame: () => {
                engine.endOfGame(gameState)
            },
            cubeActionWhite: ignore,
            cubeResponseRed: () => {
                if (engine.cubeResponse(gameState).isTake) {
                    dispatcher([{type: "Take"}])
                } else {
                    dispatcher([{type: "Pass"}])
                }
            },

            rollDiceWhite: () => {
                const roll = diceSource.rollGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },
            rollDiceRed: () => {
                const roll = diceSource.rollGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },

            checkerPlayWhite: ignore,
            commitCheckerPlayWhite: ignore,
            cubeActionRed: () => {
                if (engine.cubeAction(gameState).isDouble) {
                    dispatcher([{type: "Double"}])
                } else {
                    dispatcher([{type: "AwaitRoll"}])
                }
            },
            checkerPlayRed: () => {
                const moveMsgs = engine.checkerPlay(gameState)
                dispatcher(moveMsgs)
            },
            cubeResponseWhite: () => {
            },
            commitCheckerPlayRed: () => {
                dispatcher([{type: "Commit", force: true}]);
            }
        }
    };
}

// 以下、GameStateの各Statusに対応する、BoardActionの読み替えルールの定義

const cubeAction = (action: BoardAction): GammonMessage => {
    switch (action.type) {
        case BoardActionType.Dice:
            return {type: "AwaitRoll"};
        case BoardActionType.Cube:
            return {type: "Double"};

        default:
            return {type: "NOOP"};
    }
}

const cubeResponse = (action: BoardAction): GammonMessage => {
    switch (action.type) {
        case BoardActionType.Dice:
            return {type: "Take"};

        default:
            return {type: "NOOP"};
    }
}

const awaitCheckerPlay = (action: BoardAction): GammonMessage => {
    // 思考ルーチンのレスポンス待ち、キャンセルだけができる
    switch (action) {
        default:
            return {type: "NOOP"};
    }
}

const awaitCubeAction = (action: BoardAction): GammonMessage => {
    // 思考ルーチンのレスポンス待ち、キャンセルだけができる
    switch (action) {
        default:
            return {type: "NOOP"};
    }
}

const awaitCubeResponse = (action: BoardAction): GammonMessage => {
    // 思考ルーチンのレスポンス待ち、キャンセルだけができる
    switch (action) {
        default:
            return {type: "NOOP"};
    }
}

const checkerPlay = (action: BoardAction): GammonMessage => {
    switch (action.type) {
        case BoardActionType.Point:
            const useMinorFirst = (
                action.dices.length === 2 &&
                action.dices[0].pip < action.dices[1].pip &&
                (!action.dices[0].used && !action.dices[1].used)
            )
            return {type: "Move", pos: action.pos, useMinorFirst: useMinorFirst}
        default:
            return {type: "NOOP"};
    }
};

const commitCheckerPlay = (action: BoardAction): GammonMessage => {
    switch (action.type) {
        case BoardActionType.Dice:
            return {type: "Commit"};
        default:
            return {type: "NOOP"};
    }
};

function noop(): GammonMessage {
    return {type: 'NOOP'}
}

function ignore() {
}
