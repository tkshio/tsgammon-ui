import {add, matrix2d, product} from "../../engines/Matrix";

describe('add', () => {
    test('1x1', () => {
        const m1 = matrix2d([[1]])
        const m2 = matrix2d([[2]])
        expect(add(m1, m2).arr).toEqual([[3]])
    })
    test('2x2', () => {
        const m1 = matrix2d([[1, 2], [3, 4]])
        const m2 = matrix2d([[5, 6], [7, 8]])
        expect(add(m1, m2).arr).toEqual([[6, 8],
            [10, 12]])
    })
    test('2x3', () => {
        const m1 = matrix2d([
            [1, 2],
            [3, 4],
            [5, 6]
        ])
        const m2 = matrix2d([
            [5, 6],
            [7, 8],
            [9, 10]
        ])
        expect(add(m1, m2).arr).toEqual([
            [6, 8],
            [10, 12],
            [14, 16]])
    })
})

describe('product', () => {
    test('1x1', () => {
        const m1 = matrix2d([[1]])
        const m2 = matrix2d([[2]])
        expect(product(m1, m2).arr).toEqual([[2]])
    })
    test('2x2', () => {
        const m1 = matrix2d([[1, 2], [3, 4]])
        const m2 = matrix2d([[5, 6], [7, 8]])
        expect(product(m1, m2).arr).toEqual([[19, 22], [43, 50]])
    })
    test('2x3', () => {
        const m1 = matrix2d([[1, 2], [3, 4], [5, 6]])
        const m2 = matrix2d([[5, 6, 7, 8], [9, 10, 11, 12]])
        expect(product(m1, m2).arr).toEqual([
            [23, 26, 29, 32],
            [51, 58, 65, 72],
            [79, 90, 101, 112]])
    })

})
