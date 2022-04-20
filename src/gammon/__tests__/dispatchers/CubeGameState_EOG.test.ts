import { cube, CubeOwner, eog } from 'tsgammon-core'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { resultToCBEoG } from '../../dispatchers/CubeGameState'

describe('CBEoG', () => {
    test('holds stake for winner', () => {
        const cbEoG = resultToCBEoG(cube(1), SGResult.REDWON, eog())
        expect(cbEoG.calcStake().stake.redScore).toBe(1)
    })
    test('holds stake multiplied by cube and gammon', () => {
        const cbEoG = resultToCBEoG(
            cube(4, CubeOwner.RED),
            SGResult.WHITEWON,
            eog({ isGammon: true })
        )
        expect(cbEoG.calcStake().stake.whiteScore).toBe(8)
    })
    test('holds stake multiplied by cube and Backgammon', () => {
        const cbEoG = resultToCBEoG(
            cube(4, CubeOwner.RED),
            SGResult.WHITEWON,
            eog({ isGammon: true, isBackgammon: true })
        )
        expect(cbEoG.calcStake().stake.whiteScore).toBe(12)
    })
})
describe('jacoby rule', () => {
    const conf = { jacobyRule: true }
    test('disables gammon if cube is not used', () => {
        const cbEoG = resultToCBEoG(
            cube(1),
            SGResult.WHITEWON,
            eog({ isGammon: true })
        )
        const stakeCalc = cbEoG.calcStake(conf)
        expect(stakeCalc.stake.whiteScore).toBe(1)
        expect(stakeCalc.jacobyApplied).toBeTruthy()
    })
    test('disables backgammon if cube is not used', () => {
        const cbEoG = resultToCBEoG(
            cube(1),
            SGResult.REDWON,
            eog({ isGammon: true, isBackgammon: true })
        )
        const stakeCalc = cbEoG.calcStake(conf)
        expect(stakeCalc.stake.redScore).toBe(1)
        expect(stakeCalc.jacobyApplied).toBeTruthy()
    })
    test('enables gammon if cube is used', () => {
        const cbEoG = resultToCBEoG(
            cube(2, CubeOwner.WHITE),
            SGResult.WHITEWON,
            eog({ isGammon: true })
        )
        const stakeCalc = cbEoG.calcStake(conf)
        expect(stakeCalc.stake.whiteScore).toBe(4)
        expect(stakeCalc.jacobyApplied).toBeFalsy()
    })
    test('enables backgammon if cube is used', () => {
        const cbEoG = resultToCBEoG(
            cube(2, CubeOwner.WHITE),
            SGResult.REDWON,
            eog({ isGammon: true, isBackgammon: true })
        )
        const stakeCalc = cbEoG.calcStake(conf)
        expect(stakeCalc.stake.redScore).toBe(6)
        expect(stakeCalc.jacobyApplied).toBeFalsy()
    })
    test('recognizes cube usage by cube owner', () => {
        const cbEoG = resultToCBEoG(
            cube(2),
            SGResult.WHITEWON,
            eog({ isGammon: true })
        )
        const stakeCalc = cbEoG.calcStake(conf)
        expect(stakeCalc.stake.whiteScore).toBe(2)
        expect(stakeCalc.jacobyApplied).toBeTruthy()
    })
    test('recognizes cube usage by cube owner, not value', () => {
        const cbEoG = resultToCBEoG(
            cube(1, CubeOwner.RED),
            SGResult.WHITEWON,
            eog({ isGammon: true })
        )
        const stakeCalc = cbEoG.calcStake(conf)
        expect(stakeCalc.stake.whiteScore).toBe(2)
        expect(stakeCalc.jacobyApplied).toBeFalsy()
    })
})
