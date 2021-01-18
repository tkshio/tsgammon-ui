import {
    GameState,
    GammonMessage,
    GammonMessageMove,
    initialStateBuilder,
    standardConf,
    stateBuilder
} from "../../models/GameState";
import {Player, redPlayer, whitePlayer} from "../../models/Player";
import {gameStatus} from "../../models/GameStatus";
import {cube, CubeOwner, CubeValue} from "../../models/CubeState";
import {BoardStateNode, buildNodesWith} from "../../models/BoardStateNode";
import {dicePip, Dices, dices} from "../../models/Dices";
import {Score, score} from "../../models/Score";
import {BoardState} from "../../models/BoardState";


function makeAbsoluteMove(board: BoardState, player: Player, ...moves: GammonMessageMove[]): GammonMessageMove[] {
    return moves.map(move => {
        return {...move, pos: player.makeAbsolutePos(board, move.pos)}
    })
}

type Keys = "double" | "awaitRoll" | "roll" | "take" | "pass" | "move" | "commit" | "noop"
const gammonMessages: Record<Keys, GammonMessage> = {
    double: {type: "Double"},
    awaitRoll: {type: "AwaitRoll"},
    roll: {type: "Roll", roll: []},
    take: {type: "Take"},
    pass: {type: "Pass"},
    move: {type: "Move", pos: 1},
    commit: {type: "Commit"},
    noop: {type: "NOOP"}
};


describe('CubeAction', () => {
    test('default of Cube max is defined with Conf', () => {
        const cubeMax = 32
        const state = stateBuilder.initGameState(
            {...standardConf, cubeMax: cubeMax},
            undefined)
        expect(state.cube).not.toBe(undefined)
        expect(state.cube?.owner).toBe(undefined)
        expect(state.cube?.isMax()).toBeFalsy()
        const afterDouble = state.reduce(
            {type: "StartGame"},
            {type: "Roll", roll: dices(1, 3)},
            {type: "Commit", force: true},
            {type: "Double"},
            {type: "Take"},
        )
        const cube = afterDouble.cube?.double(whitePlayer.side)
            .double(whitePlayer.side)
            .double(whitePlayer.side)
        expect(cube?.isMax()).toBeFalsy()
        expect(cube?.double(whitePlayer.side).isMax()).toBeTruthy()

    })
    test('Cube reached max value', () => {
        testCubeReachedMax(whitePlayer, 1)
        testCubeReachedMax(redPlayer, 1)

        testCubeReachedMax(whitePlayer, 2)
        testCubeReachedMax(redPlayer, 2)

        function testCubeReachedMax(player: Player, cubeValue: CubeValue) {
            const cubeMax = cubeValue * 2 as CubeValue
            const state = stateBuilder.initGameState({
                ...standardConf,
            }, undefined, cube(cubeValue, player.side, cubeMax))
            const gameState = stateBuilder.buildCubeActionStatus(state, player)
            expect(gameState.status).toBe(player.cubeAction)

            const afterDouble = gameState.reduce({type: "Double"},
                {type: "Take"},
                {type: "Roll", roll: []},
                {type: "Commit", force: true})

            // キューブがMaxに達しているので、相手方はダブルができない
            expect(afterDouble.status).toBe(player.opponent().rollDice)
            // キューブオーナーは相手方で、キューブのスコアは2倍になっている
            expect(afterDouble.cube?.owner).toBe(player.opponent().side)
        }
    })
    test('Money game', () => {
        testMoneyGame(whitePlayer, dices(1, 3))
        testMoneyGame(redPlayer, dices(3, 1))

        function testMoneyGame(player: Player, dices: Dices) {
            const gameState = stateBuilder.initGameState({...standardConf, cubeMax: 1})
                .reduce({type: "StartGame"},
                    {type: "Roll", roll: dices},
                    {type: "Commit", force: true})
            expect(gameState.status).toBe(player.opponent().rollDice)
        }
    })
    test('Basic sequences', () => {
        testCubeActionSeq(whitePlayer, 1)
        testCubeActionSeq(redPlayer, 1)
        testCubeActionSeq(whitePlayer, 2)
        testCubeActionSeq(redPlayer, 2)
        testCubeActionSeq(whitePlayer, 4)
        testCubeActionSeq(redPlayer, 4)
        testCubeActionSeq(whitePlayer, 8)
        testCubeActionSeq(redPlayer, 8)

        function testCubeActionSeq(player: Player, cubeValue: CubeValue) {
            const state = stateBuilder.initGameState(undefined, undefined, cube(cubeValue, player.side))
            const gameState = stateBuilder.buildCubeActionStatus(state, player)
            expect(gameState.status).toBe(player.cubeAction)

            // CubeAction時はダブルかロールのみ
            testDenyStatesOtherThan(gameState, {type: "Double"}, {type: "AwaitRoll"})
            const awaitRoll = gameState.reduce({type: "AwaitRoll"})
            expect(awaitRoll.status).toBe(player.rollDice)
            testDenyStatesOtherThan(awaitRoll, {type: "Roll", roll: []})

            const cubeResponse = gameState.reduce({type: "Double"})
            expect(cubeResponse.status).toBe(player.opponent().cubeResponse)

            // ダブルされたらCubeResponseで、テイクかパス
            testDenyStatesOtherThan(cubeResponse, {type: "Take"}, {type: "Pass"})

            // パスの場合、キューブのスコアがそのまま加算される
            const pass = cubeResponse.reduce({type: "Pass"})
            expect(pass.status).toBe(gameStatus.endOfGame)
            expect(player.getScore(pass.stake)).toBe(cubeValue)
            expect(player.opponent().getScore(pass.stake)).toBe(0)

            // 相手がテイクの場合、ロールして手番続行
            const take = cubeResponse.reduce({type: "Take"})
            expect(take.status).toBe(player.rollDice)

            // （強制的に手番を終了させている）
            const afterDouble = take.reduce({type: "Roll", roll: []},
                {type: "Commit", force: true},
            )
            expect(afterDouble.status).toBe(player.opponent().cubeAction)
            // キューブオーナーは相手方で、キューブのスコアは2倍になっている
            expect(afterDouble.cube?.owner).toBe(player.opponent().side)
            expect(afterDouble.cube?.value).toBe(cubeValue * 2)

            // 自分の番が回ってきても、キューブがないのでダブルはできず、ロール待ちに移行する
            const cubeActionSkipped = afterDouble.reduce(
                {type: "AwaitRoll"},
                {type: "Roll", roll: []},
                {type: "Commit", force: true},
            )
            expect(cubeActionSkipped.status).toBe(player.rollDice)
        }
    })
})

describe('commitMoves', () => {
    test('commit', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 1, -1, 1,
                0],
            dicePip(1), dicePip(3),
            [13, 14]
        );
        const moves: GammonMessageMove[] = [
            {type: "Move", pos: 22}, {type: "Move", pos: 24}
        ]
        assertEndOfGame(node, whitePlayer, moves, score({whiteScore: 1, redScore: 0}))
        assertEndOfGame(node, redPlayer, moves, score({whiteScore: 0, redScore: 1}))
    })

    test('commit(Gammon)', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -15, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
                0],
            dicePip(1), dicePip(3),
            [13, 0]
        );
        const moves: GammonMessageMove[] = [
            {type: "Move", pos: 22}, {type: "Move", pos: 24}
        ]
        assertEndOfGame(node, whitePlayer, moves, score({whiteScore: 2, redScore: 0}))
        assertEndOfGame(node, redPlayer, moves, score({whiteScore: 0, redScore: 2}))
    })

    test('commit(Backgammon)', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 1, -15, 1,
                0],
            dicePip(1), dicePip(3),
            [13, 0]
        );
        const moves: GammonMessageMove[] = [
            {type: "Move", pos: 22}, {type: "Move", pos: 24}
        ]
        assertEndOfGame(node, whitePlayer, moves, score({whiteScore: 3, redScore: 0}))
        assertEndOfGame(node, redPlayer, moves, score({whiteScore: 0, redScore: 3}))
    })

    function assertEndOfGame(node: BoardStateNode, player: Player, moves: GammonMessageMove[], scores: Score) {
        const state = stateBuilder.initGameState({...standardConf, jacobyRule: false})
        const gameState = stateBuilder.buildCheckerPlayStatus(state, player, node)
        expect(gameState.status).toBe(player.checkerPlay)
        expect(gameState.hasMoved()).toBeFalsy()
        const afterMove = gameState.reduce(...makeAbsoluteMove(gameState.board(), player, ...moves), {type: "Commit"})
        expect(afterMove.status).toBe(gameStatus.endOfGame)
        expect(afterMove.stake.whiteScore).toBe(scores.whiteScore)
        expect(afterMove.stake.redScore).toBe(scores.redScore)
    }

})

describe('checkerPlay', () => {
    test('gameState in checkerPlay', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 2, -1, 1,
                0],
            dicePip(1), dicePip(3)
        );
        const diceAfterMoves = [{...dicePip(1), used: true}, {...dicePip(3), used: true}]

        assertStateAfterMoves(node, [{type: "Move", pos: 24}, {type: "Move", pos: 22}], diceAfterMoves)
    })

    test('gameState in checkerPlay(clicked with minor pip)', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 2, -2, 1,
                0],
            dicePip(1), dicePip(3)
        );
        const diceAfterMoves = [{...dicePip(3), used: true}, {...dicePip(1), used: true}]

        assertStateAfterMoves(node, [{type: "Move", pos: 22}, {type: "Move", pos: 24}], diceAfterMoves)
    })

    test('gameState in checkerPlay(clicked with minor pip, dice swapped)', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 2, -2, 1,
                0],
            dicePip(3), dicePip(1)
        );
        const diceAfterMoves = [{...dicePip(3), used: true}, {...dicePip(1), used: true}]

        assertStateAfterMoves(node, [{type: "Move", pos: 22}, {type: "Move", pos: 24}], diceAfterMoves)
    })

    test('gameState in checkerPlay(with unusable dice)', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                0],
            dicePip(1), dicePip(3)
        );
        // どちらのダイスを使ってもよいが、大きい目を優先する手を列挙するので結果的に目が入れ替わる
        const diceAfterMoves = [{...dicePip(3), used: true}, {...dicePip(1), used: true}]

        assertStateAfterMoves(node, [{type: "Move", pos: 24}], diceAfterMoves)
    })

    test('gameState in checkerPlay(with unusable dice, dice swapped)', () => {
        const node = buildNodesWith(
            [0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                0],
            dicePip(3), dicePip(1)
        );
        const diceAfterMoves = [{...dicePip(3), used: true}, {...dicePip(1), used: true}]

        assertStateAfterMoves(node, [{type: "Move", pos: 24}], diceAfterMoves)
    })

    function assertStateAfterMoves(node: BoardStateNode, moves: { type: "Move", pos: number }[],
                                   diceAfterMoves: Dices
    ) {
        assertStateAfterMovesForPlayers(whitePlayer, node, moves, diceAfterMoves)
        assertStateAfterMovesForPlayers(redPlayer, node, moves, diceAfterMoves)

    }

    function assertStateAfterMovesForPlayers(player: Player, node: BoardStateNode, moves: GammonMessageMove[], diceAfterMoves: Dices) {
        const state = stateBuilder.initGameState()
        const gameState = stateBuilder.buildCheckerPlayStatus(state, player, node)
        expect(gameState.status).toBe(player.checkerPlay)
        expect(gameState.hasMoved()).toBeFalsy()
        const afterMove = gameState.reduce(...makeAbsoluteMove(gameState.board(), player, ...moves))
        expect(afterMove.status).toBe(player.commitCheckerPlay)
        expect(afterMove.dices()).toEqual(diceAfterMoves)
        expect(afterMove.hasMoved()).toBeTruthy()

        const reverted = gameState.reduce({type: "Revert"})
        expect(reverted.status).toBe(player.checkerPlay)
        expect(reverted.dices()).toEqual(gameState.dices())
        expect(reverted.absoluteBoard().points()).toEqual(gameState.absoluteBoard().points())
        expect(reverted.hasMoved()).toBeFalsy()
    }

    test('gameState in checkerPlay(unplayable)', () => {
        const node = buildNodesWith(
            [0,
                -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(3)
        );
        const diceAfterMoves = [{...dicePip(3), used: true}, {...dicePip(1), used: true}]

        const state = stateBuilder.initGameState()
        const gameStateRed = stateBuilder.buildCheckerPlayStatus(state, redPlayer, node)
        expect(gameStateRed.status).toBe(redPlayer.commitCheckerPlay)
        expect(gameStateRed.hasMoved()).toBeFalsy()
        expect(gameStateRed.dices()).toEqual(diceAfterMoves)

        const gameStateWhite = stateBuilder.buildCheckerPlayStatus(state, whitePlayer, node)
        expect(gameStateWhite.status).toBe(whitePlayer.commitCheckerPlay)
        expect(gameStateWhite.hasMoved()).toBeFalsy()
        expect(gameStateWhite.dices()).toEqual(diceAfterMoves)
    })


    test('checkerPlay build checkerPlay in midst', () => {
        const node = buildNodesWith(
            [0,
                -1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(3)
        );
        const nodeAfterMove = buildNodesWith(
            [0,
                -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), {...dicePip(3), used: true}
        );

        const state = stateBuilder.initGameState()
        const gameState = stateBuilder.buildCheckerPlayStatus(state, redPlayer, nodeAfterMove, node)
        expect(gameState.hasMoved()).toBeTruthy()
        const afterRevert = state.reduce({type: "Revert"})
        expect(afterRevert.hasMoved()).toBeFalsy()
    })
})
describe('Opening', () => {
    test('opening with default setting', () => {
        const state = stateBuilder.initGameState()
        expect(state.status).toBe(gameStatus.initialized)
        expect(state.absoluteBoard().points()).toEqual([
            0,
            2, 0, 0, 0, 0, -5, 0, -3, 0, 0, 0, 5,
            -5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2,
            0
        ])
        expect(state.board().myBornOff()).toBe(0)
        expect(state.board().opponentBornOff()).toBe(0)

        testDenyStatesOtherThan(state, {type: "StartGame"})
        const opening = state.reduce({type: "StartGame"})
        testDenyStatesOtherThan(opening, {type: "Roll", roll: []})
        expect(opening.reduce({type: "Roll", roll: dices(1, 3)}).status).toBe(whitePlayer.checkerPlay)
        expect(opening.reduce({type: "Roll", roll: dices(3, 1)}).status).toBe(redPlayer.checkerPlay)
        // 現状では同値の場合はWhite先攻
        expect(opening.reduce({type: "Roll", roll: dices(3, 3)}).status).toBe(whitePlayer.checkerPlay)
    })
})

describe('Calc scores at End of game', () => {
    test('normal win', () => {
        const last = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), standardConf, [0,
            0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -1,
            0
        ], cube(1, undefined))

        expect(last.status).toEqual(gameStatus.commitCheckerPlayWhite)
        const eog = last.reduce({type: "Commit"})
        expect(eog.status).toEqual(gameStatus.endOfGame)
        expect(eog.stake).toMatchObject({whiteScore: 1, redScore: 0})

        const doubled = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2),
            standardConf, [0,
                1, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
                0
            ], cube(2, CubeOwner.RED), false)
        expect(doubled.reduce({type: "Commit"}).stake)
            .toMatchObject({whiteScore: 0, redScore: 2})

    })
    test('gammon win', () => {
        const last = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), {
            ...standardConf,
            jacobyRule: false
        }, [0,
            0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -15,
            0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
            0
        ], cube(1, undefined))

        expect(last.status).toEqual(gameStatus.commitCheckerPlayWhite)
        const eog = last.reduce({type: "Commit"})
        expect(eog.status).toEqual(gameStatus.endOfGame)
        expect(eog.stake).toMatchObject({whiteScore: 2, redScore: 0})

        const jacoby = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), standardConf,
            [0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -15,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
                0
            ], cube(1, undefined))
        expect(jacoby.reduce({type: "Commit"}).stake)
            .toMatchObject({whiteScore: 1, redScore: 0})

        const jacobyDoubled = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), standardConf,
            [0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -15,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
                0
            ], cube(2, CubeOwner.RED))
        expect(jacobyDoubled.reduce({type: "Commit"}).stake)
            .toMatchObject({whiteScore: 4, redScore: 0})
    })
    test('backgammon win', () => {
        const last = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), {
            ...standardConf,
            jacobyRule: false
        }, [0,
            0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -15,
            0
        ], cube(1, undefined))

        expect(last.status).toEqual(gameStatus.commitCheckerPlayWhite)
        const eog = last.reduce({type: "Commit"})
        expect(eog.status).toEqual(gameStatus.endOfGame)
        expect(eog.stake).toMatchObject({whiteScore: 3, redScore: 0})

        const jacoby = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), standardConf,
            [0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -15,
                0
            ], cube(1, undefined))
        expect(jacoby.reduce({type: "Commit"}).stake)
            .toMatchObject({whiteScore: 1, redScore: 0})

        const jacobyDoubled = initialStateBuilder.buildCheckerPlayStatus(dicePip(1), dicePip(2), standardConf,
            [0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /*bar */ 0, 0, 0, 0, 0, -15,
                0
            ], cube(4, CubeOwner.WHITE))
        expect(jacobyDoubled.reduce({type: "Commit"}).stake)
            .toMatchObject({whiteScore: 12, redScore: 0})

    })
})

test('apply basic action sequence', () => {
    const gameState = stateBuilder.initGameState()
    expect(gameState.status).toEqual(gameStatus.initialized)

    // オープニングではロールのみ可能
    testDenyStatesOtherThan(gameState, {type: "StartGame"})

    const awaitOP = gameState.reduce({type: "StartGame"});

    // ダイスが小→大なら白
    {
        const rolled = awaitOP.reduce({
            type: "Roll", roll: dices(2, 4)
        })
        expect(rolled.status).toBe(gameStatus.checkerPlayWhite)
    }
    // 逆なら赤先攻
    const rolled = awaitOP.reduce({
        type: "Roll", roll: dices(4, 2)
    })

    // ロール後はチェッカープレイ
    expect(rolled.status).toBe(gameStatus.checkerPlayRed)
    const midst = rolled.reduce({type: "Move", pos: 24})
    expect(midst.status).toBe(gameStatus.checkerPlayRed)

    const moved = midst.reduce({type: "Move", pos: 24})
    expect(moved.status).toBe(gameStatus.commitCheckerPlayRed)
    const committed = moved.reduce({type: "Commit"});
    expect(committed.status).toBe(gameStatus.cubeActionWhite)

    // Whiteのダブル
    const whiteDoubles = committed.reduce({type: "Double"})
    expect(whiteDoubles.status).toBe(gameStatus.cubeResponseRed)

    // Redのテイク
    const redTakes = whiteDoubles.reduce({type: "Take"})
    expect(redTakes.status).toBe(gameStatus.rollDiceWhite)
    expect(redTakes.cube?.owner).toBe(CubeOwner.RED)

    // Whiteのロールとムーブ
    const whiteCommitted = redTakes.reduce({type: "Roll", roll: dices(1, 3)})
        .reduce({type: "Commit", force: true});
    expect(whiteCommitted.status).toBe(gameStatus.cubeActionRed)

    // Redのリダブル
    const redRedoubles = whiteCommitted.reduce({type: "Double"})
    expect(redRedoubles.status).toBe(gameStatus.cubeResponseWhite)

    // Whiteリダブルテイク
    const whiteTakesRedouble = redRedoubles.reduce({type: "Take"})
    expect(whiteTakesRedouble.status).toBe(gameStatus.rollDiceRed)
    expect(whiteTakesRedouble.cube?.owner).toBe(CubeOwner.WHITE)

    // Redのプレイ・Whiteのキューブアクション
    const redCommitted = whiteTakesRedouble.reduce(
        {type: "Roll", roll: dices(2, 3)},
        {type: "Move", pos: 13},// diceNumber(1, 2)},
        {type: "Move", pos: 13},// diceNumber(1, 2)},
        {type: "Commit"},
        {type: "AwaitRoll"}
    )
    expect(redCommitted.status).toBe(gameStatus.rollDiceWhite)
    // Whiteのムーブ
    const whiteCommitted2 = redCommitted.reduce(
        {type: "Roll", roll: dices(3, 4)},
        {type: "Commit", force: true},
    )
    // Redはすぐロールに移行
    expect(whiteCommitted2.status).toBe(gameStatus.rollDiceRed);
    expect(whiteCommitted2.cube?.owner).toBe(CubeOwner.WHITE)

    const redCommitted2 = whiteCommitted2.reduce(
        // Redのプレイ
        {type: "Roll", roll: dices(5, 6)},
        {type: "Commit", force: true},
        // Whiteのダブル
        // Redのテイク
        {type: "Double"},
        {type: "Take"},

        // Whiteのプレイ
        {type: "Roll", roll: dices(5, 6)},
        {type: "Commit", force: true},

        // Redのプレイ
        {type: "AwaitRoll"},
        {type: "Roll", roll: dices(5, 6)},
        {type: "Commit", force: true},
    )
        // Whiteはすぐロールに移行
        expect(redCommitted2.status).toBe(gameStatus.rollDiceWhite);
        expect(redCommitted2.cube?.owner).toBe(CubeOwner.RED)
    }
)

/**
 * 与えられたgameStateについて、指定されたメッセージ以外は無視することを確認する
 * @param gameState 対象となる任意のgameState
 * @param targetMessages 無視するべきでないメッセージ
 */
function testDenyStatesOtherThan(gameState: GameState, ...targetMessages: GammonMessage[]) {
    // すべての種類のメッセージのうち
    Object.entries(gammonMessages)
        // targetMessagesに含まれないものについて
        .filter(([, message]) => {
            return !targetMessages.find((msg) => (message.type === msg.type))
        })
        // 適用後の状態が変わらない＝無視されている
        .forEach(([, message]) => {
            const afterState = gameState.reduce(message);
            expect(afterState).toBe(gameState);
        })
}
