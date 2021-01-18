import {BoardStateNode, buildNodesWith, collectMoves, Move} from "../../models/BoardStateNode";
import {dicePip} from "../../models/Dices";

export function move(from: number, to: number, isHit?: boolean): Move {
    return {from: from, to: to, pip: to - from, isHit: !!isHit}
}

describe('Basic Backgammon rules', () => {
    test('Can\'t go into blocked points', () => {
        const node = buildNodesWith([0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                2, 0, -2, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
                dicePip(1), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(13, 14), move(14, 16)],
                // move 13/15 is illegal
            ])
        }
    )
    test('Must move pieces on the bar first', () => {
            const node = buildNodesWith([1,
                    1, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                    0],
                dicePip(1), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(0, 2), move(1, 2)],
                [move(0, 2), move(2, 3)],
                [move(0, 1), move(1, 3)],
                // move 1/2 0/2, 1/3 0/2 is illegal
            ])
        }
    )
    test('Ignore unusable rolls', () => {
            const node = buildNodesWith([0,
                    1, -2, 0, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                    0],
                dicePip(1), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(1, 3)],
                // can't use dicePip(1)
            ])
        }
    )
    test('Must use both rolls', () => {
            const node = buildNodesWith([0,
                    0, -2, 0, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 1, 0, /* bar */ 0, 0, 1, -2, 0, 0,
                    0],
                dicePip(5), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(17, 19), move(19, 24)],
                // move 21/23 is illegal(must use dicePip(5))
            ])
        }
    )
    test('Must use bigger one when both rolls couldn\'t be used at once', () => {
        const node = buildNodesWith([0,
                1, 0, 0, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(2))
        expect(collectMoves(node)).toEqual([
                [move(1, 3)],
                // move 1/2 is illegal
            ])
        }
    )
    test('May use rolls in any order when both rolls are available', () => {
            const pieces = [0,
                1, 0, 0, 0, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0]
            {
                const node = buildNodesWith(pieces,
                    dicePip(1), dicePip(2))
                expect(collectMoves(node)).toEqual([
                    [move(1, 3), move(3, 4)],
                    [move(1, 2), move(2, 4)],
                ])
            }
            {
                const node = buildNodesWith(pieces,
                    dicePip(2), dicePip(1)) // dices swapped
                expect(collectMoves(node)).toEqual([
                    [move(1, 3), move(3, 4)],
                    [move(1, 2), move(2, 4)],
                ])
            }
        }
    )
    test('Hit piece goes to the bar', () => {
            const node = buildNodesWith([0,
                    1, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                    0],
                dicePip(1), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(1, 2, true)],
            ])
            const afterMove = node.minorFirst(1)
            expect(afterMove.hasValue).toBeTruthy()
            expect((afterMove as BoardStateNode).board.piecesAt(25)).toEqual(-1)
        }
    )
    test('All pieces must be in inner board before bearing off', () => {
            const node = buildNodesWith([0,
                    1, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 1,
                    0],
                dicePip(1), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(1, 2, true)],
            ])
        }
    )
    test('All pieces must be in inner board before bearing off 2', () => {
            const node = buildNodesWith([0,
                    0, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 1, 1,
                    0],
                dicePip(1), dicePip(2))
            expect(collectMoves(node)).toEqual([
                [move(23, 25), move(24, 25)],
                [move(23, 24), move(24, 26)],
                [move(24, 25), move(23, 25)],
            ])
        }
    )
    test('All pieces must be in inner board before bearing off 3', () => {
            const node = buildNodesWith([0,
                    0, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0,
                    0, 1, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 1, 0,
                    0],
                dicePip(2), dicePip(5))
            expect(collectMoves(node)).toEqual([
                [move(14, 19), move(19, 21)],
                [move(14, 19), move(23, 25)],
                [move(14, 16), move(16, 21)],
            ])
        }
    )
    test('You don\'t have to use all dices at the end of game', () => {
            const node = buildNodesWith([0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, /* bar */ 0, 1, 0, 0, 0, 0,
                    0],
                dicePip(2), dicePip(5))
            expect(collectMoves(node)).toEqual([
                [move(20, 25)],
                [move(20, 22), move(22, 27)],
            ])
        }
    )
})

describe('listup moves', () => {
    test('listup moves', () => {
        const node = buildNodesWith([0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                1, 0, 1, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(2))


        expect(collectMoves(node)).toEqual([
            [move(13, 15), move(15, 16)],
            [move(15, 17), move(13, 14)],
            [move(15, 17), move(17, 18)],
            [move(13, 14), move(14, 16)],
            [move(13, 14), move(15, 17)],
            [move(15, 16), move(13, 15)],
            [move(15, 16), move(16, 18)],
        ])
    })
    test('listup moves(rec)', () => {
        const node = buildNodesWith([0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                1, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(1))


        expect(collectMoves(node)).toEqual([
            [move(13, 14), move(14, 15), move(15, 16), move(16, 17),],
        ])
        const node2 = buildNodesWith([0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                1, 0, 1, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(1))

        const ret = collectMoves(node2)
        expect(ret).toEqual([
            // 13-14: 14, 15
            // 13-14: 14-15: 15x2
            [move(13, 14), move(14, 15),
                move(15, 16), move(15, 16),],
            [move(13, 14), move(14, 15),
                move(15, 16), move(16, 17),],
            // 13-14: 15-16: 14, 16
            [move(13, 14), move(15, 16),
                move(14, 15), move(15, 16),],
            [move(13, 14), move(15, 16),
                move(14, 15), move(16, 17),],
            [move(13, 14), move(15, 16),
                move(16, 17), move(14, 15),],
            [move(13, 14), move(15, 16),
                move(16, 17), move(17, 18),],
            // 15-16: 13, 16
            // 15-16: 13-14: 14, 16
            [move(15, 16), move(13, 14),
                move(14, 15), move(15, 16),],
            [move(15, 16), move(13, 14),
                move(14, 15), move(16, 17),],
            [move(15, 16), move(13, 14),
                move(16, 17), move(14, 15),],
            [move(15, 16), move(13, 14),
                move(16, 17), move(17, 18),],
            // 15-16: 16-17: 13, 17
            [move(15, 16), move(16, 17),
                move(13, 14), move(14, 15),],
            [move(15, 16), move(16, 17),
                move(13, 14), move(17, 18),],
            [move(15, 16), move(16, 17),
                move(17, 18), move(13, 14),],
            [move(15, 16), move(16, 17),
                move(17, 18), move(18, 19),],
        ])
    })
    test('listup moves for empty board', () => {
        const node = buildNodesWith([0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(2))

        expect(collectMoves(node)).toEqual([
            []
        ])
    })

    test('listup moves for empty board(rec)', () => {
        const node = buildNodesWith([0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                0],
            dicePip(1), dicePip(1))

        expect(collectMoves(node)).toEqual([
            []
        ])
    })
})

describe('implement dependent', () => {
        test('Bar point should not block opponent', () => {
                const node = buildNodesWith([0,
                        0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 1,
                        -2],
                    dicePip(1), dicePip(1))
                expect(collectMoves(node)).toEqual([
                    [move(24, 25)],
                ])
            }
        )
    }
)
