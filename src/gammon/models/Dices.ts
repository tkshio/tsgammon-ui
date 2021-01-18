export type Dices = DicePip[]
export type DicePip = {
    pip: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    used: boolean;
}

export function dices(...pips: number[]): Dices {
    return pips.map(dicePip)
}

export function dicePip(n: number): DicePip {
    return {pip: n as 1 | 2 | 3 | 4 | 5 | 6, used: false}
}

export function formatDices(dices: Dices, fmtDoublet: boolean = true): string {
    if (dices.length === 0 ||
        dices[0].pip === 0) {
        return ""
    }

    if (dices.length === 1) {
        return dices[0].pip + ""
    }

    return (fmtDoublet && dices[0].pip === dices[1].pip) ?
        `${dices[0].pip}(${dices.length})` // ex. 3333 => 3(4)
        : `${dices[0].pip}${dices[1].pip}`
}