export interface Matrix2d {
    arr: number[][],

    rowsN(): number,

    colsN(): number
}

export function matrix2d(value: number[][]): Matrix2d {

    return {
        arr: value,
        rowsN() {
            return this.arr.length
        },
        colsN() {
            return this.arr.length === 0 ? 0 : this.arr[0].length
        },
    }
}

export function product(m1: Matrix2d, m2: Matrix2d): Matrix2d {
    if (m1.colsN() !== m2.rowsN()) {
        throw Error()
    }
    const mp: number[][] = m1.arr.map((rowValues: number[], i) => {
            // rowValues = [a, b]
            const newRow: number[] = Array(m2.colsN()).fill(0)
            return newRow.map((v, j) => {
                return m1.arr[i].map((v, ii) => {
                    return m2.arr[ii][j] * v
                }).reduce((a, b) => a + b)
            })
        }
    )
    return matrix2d(mp)
}

export function add(m1: Matrix2d, m2: Matrix2d): Matrix2d {
    if (m1.rowsN() !== m2.rowsN() ||
        m1.colsN() !== m2.colsN()) {
        throw Error()
    }

    return matrix2d(m1.arr.map((row, i) => {
        return row.map((value, j) => m2.arr[i][j] + value)
    }))
}