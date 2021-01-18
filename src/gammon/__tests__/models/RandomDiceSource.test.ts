import {presetDiceSource} from "../../models/DiceSource";
import {dices} from "../../models/Dices";

test('presetDiceSource', () => {
    const diceSource = presetDiceSource(1, 2, 3, 2, 6, 1, 3, 3, 2, 4)
    expect(diceSource.rollGammonDice()).toEqual(dices(1, 2))
    expect(diceSource.rollGammonDice()).toEqual(dices(3, 2))
    expect(diceSource.rollGammonDice()).toEqual(dices(6, 1))
    expect(diceSource.rollGammonDice()).toEqual(dices(3, 3, 3, 3))
    expect(diceSource.rollGammonDice()).toEqual(dices(2, 4))
    expect(diceSource.rollGammonDice()).toBeTruthy()//何か値が返っていればよし
})

test('presetDiceSource(with openingRolls)', () => {
    const diceSource = presetDiceSource(1, 2, 3, 2, 6, 1, 3, 3, 2, 4)
    expect(diceSource.rollOpeningGammonDice()).toEqual(dices(1, 2))
    expect(diceSource.rollGammonDice()).toEqual(dices(3, 2))
    expect(diceSource.rollGammonDice()).toEqual(dices(6, 1))
    expect(diceSource.rollOpeningGammonDice()).toEqual(dices(2, 4)) // 3,3はスルー
    expect(diceSource.rollGammonDice()).toBeTruthy()//何か値が返っていればよし
})