import {Dices, dices} from "./Dices";

export interface DiceSource {
    rollOpeningGammonDice(): Dices

    rollGammonDice(): Dices
}

export function randomDiceSource(): DiceSource {
    return {rollGammonDice: rollGammonDice(rollDice), rollOpeningGammonDice: rollOpeningGammonDice(rollDice)};
}

/**
 * 指定された配列が尽きるまでは、その内容がロール目として返る
 * 尽きた後は、randomDiceSourceと同じ動作をする
 * @param pips
 */
export function presetDiceSource(...pips: number[]): DiceSource {
    const pipEntries = pips.entries()
    const dice: () => number = () => {
        const value = pipEntries.next()
        return value.done ? rollDice() : value.value[1]
    }
    return {rollGammonDice: rollGammonDice(dice), rollOpeningGammonDice: rollOpeningGammonDice(dice)}
}

function rollDice(): number {
    return (Math.floor(Math.random() * 6) + 1);
}

function rollGammonDice(rollDice: () => number): () => Dices {
    return () => {
        const d1 = rollDice();

        const d2 = rollDice();

        const pips: number[] = (d1 === d2) ? Array(4).fill(d1) : [d1, d2]
        return dices(...pips);
    }
}

function rollOpeningGammonDice(rollDice: () => number): () => Dices {
    return () => {
        let co = 0;
        do {
            const d1 = rollDice();

            const d2 = rollDice();
            if (d1 !== d2) {
                return dices(d1, d2);
            }
        } while (co < 10000);

        throw new Error("opening rolls get same rolls for 10000 times")
    }
}

