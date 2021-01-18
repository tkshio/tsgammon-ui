import {BoardState, initBoardState} from "../../models/BoardState";
import {standard} from "../../models/AbsoluteBoardState";

test('initialize board', () => {

    const board = initBoardState(standard, [0, 0])
    testWith(board, standard)
    testWith(board.revert(), standard)

    function testWith(board: BoardState, pieces: number[], bornOffs: [number, number] = [0, 0]
    ) {
        expect(board.points().map(value => value)).toEqual(pieces)
        expect(board.lastPiecePos()).toEqual(1)
        expect(board.isBearable()).toBeFalsy()
        standard.forEach((pieces, index) => {
            expect(board.piecesAt(index)).toEqual(pieces)
        })
        expect(board.myBornOff()).toBe(bornOffs[0])
        expect(board.opponentBornOff()).toBe(bornOffs[1])
        expect(board.eogStatus().isEndOfGame).toBeFalsy()
        expect(board.eogStatus().isGammon).toBeFalsy()
        expect(board.eogStatus().isBackgammon).toBeFalsy()

    }
})
describe('Moving piece', () => {
    test('move piece and hit', () => {
        const board = initBoardState(standard).movePiece(1, 3)
        const expected = [...standard]
        expected[1] = 1
        expected[4] = 1
        expected.forEach((pieces, i) => {
            expect(board.piecesAt(i)).toEqual(pieces)
        })
        expect(board.piecesAt(1)).toBe(1)
        expect(board.piecesAt(4)).toBe(1)

        // revert and hit
        const revertAndHit = board.revert().movePiece(19, 2)
        expect(revertAndHit.piecesAt(19)).toBe(4)
        expect(revertAndHit.piecesAt(21)).toBe(1)
        expect(revertAndHit.piecesAt(25)).toBe(-1)

        // reenter and hit
        const revertAndReenter = revertAndHit.revert().movePiece(0, 4)
        expect(revertAndReenter.piecesAt(4)).toBe(1)
        expect(revertAndReenter.piecesAt(25)).toBe(-1)

    })

    test('ignore illegal move', () => {
        const board = initBoardState(standard)
        const noPiece = board.movePiece(2, 3)
        expect(noPiece).toBe(board)
        const opponentPiece = board.movePiece(6, 3)
        expect(opponentPiece).toBe(board)
        const blocked = board.movePiece(1, 5)
        expect(blocked).toBe(board)
        const outOfRange = board.movePiece(-1, 5)
        expect(outOfRange).toBe(board)
    })

    test('may bearOff', () => {
        const board = initBoardState(standard)
        // ベアオフをしてよいかどうかは、BoardStateの管轄外
        const bornOff = board.movePiece(19, 6)
        expect(board.isBearable()).toBeFalsy()
        expect(bornOff).not.toBe(board)
        expect(bornOff.myBornOff()).toBe(1)
        expect(bornOff.opponentBornOff()).toBe(0)

        // オーバーランはベアオフ扱い
        const overRun = board.movePiece(19, 20)
        expect(overRun).not.toBe(board)
        expect(bornOff.myBornOff()).toBe(1)
        expect(bornOff.opponentBornOff()).toBe(0)

    })
})
describe('bear off', () => {
    test('may bear off when all pieces get into inner', () => {
        const pieces = [0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, -1, -1,
            0, 0, 0, 0, 0, 1,/* bar */ 0, 0, 0, 0, 1, 1,
            0
        ]
        const board = initBoardState(pieces, [0, 0])
        expect(board.isBearable()).toBeFalsy()
        expect(board.isBearable()).toBeFalsy() // test twice for memoization
        expect(board.lastPiecePos()).toBe(18)
        expect(board.lastPiecePos()).toBe(18) // test twice for memoization
        const afterMove = board.movePiece(18, 1)
        expect(afterMove.lastPiecePos()).toBe(19)
        expect(afterMove.lastPiecePos()).toBe(19)
        expect(afterMove.isBearable()).toBeTruthy()
        expect(afterMove.isBearable()).toBeTruthy()
    })

    test('can\'t bear off (piece on the bar )', () => {
        const pieces = [1,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, -1, -1,
            0, 0, 0, 0, 0, 1,/* bar */ 0, 0, 0, 0, 1, 1,
            0
        ]
        const board = initBoardState(pieces, [0, 0])
        expect(board.isBearable()).toBeFalsy()
        expect(board.lastPiecePos()).toBe(0)
    })
})

describe('endOfGame', () => {
    test('is EndOfGame when there is no pieces', () => {
        const pieces = [0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, -1,
            0
        ]
        const board = initBoardState(pieces, [0, 15])
        const eog = board.eogStatus()
        expect(eog.isEndOfGame).toBeTruthy()
        expect(eog.isGammon).toBeFalsy()
        expect(eog.isBackgammon).toBeFalsy()
    })
    test('is Gammon if opponent doesn\'t have born off', () => {
        const pieces = [0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, -1,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            0
        ]
        const board = initBoardState(pieces, [0, 0])// 駒の総数は管理していない
        const eog = board.eogStatus()
        expect(eog.isEndOfGame).toBeTruthy()
        expect(eog.isGammon).toBeTruthy()
        expect(eog.isBackgammon).toBeFalsy()
    })
    test('is Backgammon if pieces exists in inner', () => {
        const pieces = [0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, -1,
            0
        ]
        const board = initBoardState(pieces, [0, 0])
        const eog = board.eogStatus()
        expect(eog.isEndOfGame).toBeTruthy()
        expect(eog.isGammon).toBeTruthy()
        expect(eog.isBackgammon).toBeTruthy()
    })
    test('isBackgammon(on the bar)', () => {
        const pieces = [0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            -1
        ]
        const board = initBoardState(pieces, [0, 0])
        const eog = board.eogStatus()
        expect(eog.isEndOfGame).toBeTruthy()
        expect(eog.isGammon).toBeTruthy()
        expect(eog.isBackgammon).toBeTruthy()
    })
    test('is not Backgammon if not gammon', () => {
        const pieces = [0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/* bar */ 0, 0, 0, 0, 0, 0,
            -1
        ]
        const board = initBoardState(pieces, [0, 1])
        const eog = board.eogStatus()
        expect(eog.isEndOfGame).toBeTruthy()
        expect(eog.isGammon).toBeFalsy()
        expect(eog.isBackgammon).toBeFalsy()
    })
})
