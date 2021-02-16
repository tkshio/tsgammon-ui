import {GameState, GammonMessage, initialStateBuilder} from "../../models/GameState";
import {DispatchOperator, gameStatus} from "../../models/GameStatus";
import {score} from "../../models/Score";
import {GammonEngine, randomEngine} from "../../engines/GammonEngine";
import {DiceSource, randomDiceSource} from "../../models/DiceSource";


test('run 1000 games', () => {
    let gameState: GameState = initialStateBuilder.buildOpeningStatus()
    const autoOperator = selfPlayOperator()
    const dispatcher = (messages: GammonMessage[]) => {
        const reduced = messages.reduce((state, message) => {
            return state.reduce(message);
        }, gameState)

        if (reduced === gameState) {
            console.error("Status unchanged with messages", gameState, messages)
            throw (reduced)
        }

        gameState = reduced
    }
    let gameScore = score()
    for (let i = 0; i < 1000; i++) {
        do {
            gameState.status.accept(autoOperator(gameState, dispatcher));
        } while (gameState !== undefined && gameState.status !== gameStatus.endOfGame)
        if (gameState) { //?
            gameScore = gameScore.add(gameState.stake)
            gameState = gameState.reduce({type: "Restart"})
        }
    }
    console.log(`red:${gameScore.redScore}-${gameScore.whiteScore}`)
})


function selfPlayOperator(engine: GammonEngine = randomEngine(),
                          diceSource: DiceSource = randomDiceSource()) {
    return (gameState: GameState, dispatcher: (messages: GammonMessage[]) => void): DispatchOperator<void> => {
        function cubeAction() {
            if (engine.cubeAction(gameState).isDouble) {
                dispatcher([{type: "Double"}])
            } else {
                dispatcher([{type: "AwaitRoll"}])
            }
        }

        function cubeResponse() {
            if (engine.cubeResponse(gameState).isTake) {
                dispatcher([{type: "Take"}])
            } else {
                dispatcher([{type: "Pass"}])
            }
        }

        function rollDice() {
            const roll = diceSource.rollGammonDice()
            dispatcher([{type: 'Roll', roll: roll}])
        }

        function checkerPlay() {
            const moveMsgs = engine.checkerPlay(gameState)
            dispatcher(moveMsgs)
        }

        function commitCheckerPlay() {
            dispatcher([{type: "Commit", force: true}]);
        }

        return {
            initialized: () => {
                engine.initialized(gameState)
                dispatcher([{type: 'StartGame'}])

            },
            rollOpening: () => {
                const roll = diceSource.rollOpeningGammonDice()
                dispatcher([{type: 'Roll', roll: roll}])
            },
            endOfGame: () => {
                engine.endOfGame(gameState)
            },
            cubeActionWhite: cubeAction,
            cubeResponseWhite: cubeResponse,
            rollDiceWhite: rollDice,
            checkerPlayWhite: checkerPlay,
            commitCheckerPlayWhite: commitCheckerPlay,

            cubeActionRed: cubeAction,
            cubeResponseRed: cubeResponse,
            rollDiceRed: rollDice,
            checkerPlayRed: checkerPlay,
            commitCheckerPlayRed: commitCheckerPlay
        }
    };
}

