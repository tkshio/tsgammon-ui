import { CubeState } from 'tsgammon-core'
import { EOGStatus } from 'tsgammon-core/EOGStatus';

export type StakeConf = {
    jacobyRule: boolean
}

export function applyStakeConf(
    cubeState: CubeState,
    eogStatus: EOGStatus,
    stakeConf: StakeConf = {jacobyRule:false},
): { eogStatus: EOGStatus; stake: number; jacobyApplied: boolean } {
    const jacobyApplied = stakeConf.jacobyRule && cubeState.owner === undefined

    const eog = jacobyApplied
        ? { ...eogStatus, isGammon: false, isBackgammon: false }
        : eogStatus

    return {
        eogStatus: eog,
        stake: eog.calcStake(cubeState.value),
        jacobyApplied,
    }
}
