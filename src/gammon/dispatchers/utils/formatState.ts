import { Ply } from 'tsgammon-core'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { MoveFormatDirection } from 'tsgammon-core/utils/formatAbsMove'
import { formatPly, formatPlyAbbr } from 'tsgammon-core/utils/formatPly'
import { CheckerPlayState } from '../CheckerPlayState'
import { CBState } from '../CubeGameState'
import { SGState } from '../SingleGameState'

export function formatState(
    sgState: SGState,
    cbState?: CBState,
    cpState?: CheckerPlayState,
    moveFormatDirection?: MoveFormatDirection
) {
    if (cbState && cbState.tag !== 'CBInPlay') {
        switch (cbState.tag) {
            case 'CBOpening':
                return 'Opening roll.'

            case 'CBResponse':
                return `${
                    cbState.isDoubleFromRed ? 'Red' : 'White'
                } offers double.`

            case 'CBAction': {
                const lastPly =
                    sgState.tag === 'SGToRoll' ? sgState.lastPly : undefined
                return formatToRoll(cbState.isRed, lastPly, moveFormatDirection)
            }
            case 'CBToRoll': {
                const lastPly =
                    sgState.tag === 'SGToRoll' ? sgState.lastPly : undefined
                return cbState.lastAction === 'Take'
                    ? `${cbState.isRed ? 'White' : 'Red'} accepts the cube.`
                    : formatToRoll(cbState.isRed, lastPly, moveFormatDirection)
            }
            case 'CBEoG': {
                return `${
                    cbState.result === SGResult.REDWON
                        ? 'Red win.'
                        : cbState.result === SGResult.WHITEWON
                        ? 'White win.'
                        : ''
                }`
            }
        }
    }

    return formatSGState(sgState, cpState, moveFormatDirection)
}

function formatToRoll(
    isRed: boolean,
    lastPly?: Ply,
    moveFormatDirection?: MoveFormatDirection
) {
    return (
        `${isRed ? 'Red' : 'White'} to roll.` +
        (lastPly
            ? ` ( last play ${formatPlyAbbr(lastPly, moveFormatDirection)} )`
            : '')
    )
}

function formatSGState(
    sgState: SGState,
    cpState?: CheckerPlayState,
    moveFormatDirection?: MoveFormatDirection
) {
    // 移動中
    if (cpState) {
        return formatPly(cpState.curPly)
    }
    switch (sgState.tag) {
        case 'SGOpening':
            return 'Opening roll.'
        case 'SGToRoll':
            return formatToRoll(
                sgState.isRed,
                sgState.lastPly,
                moveFormatDirection
            )
        case 'SGInPlay': {
            return formatPly(sgState.curPly)
        }
        case 'SGEoG': {
            return `${sgState.isRed ? 'Red' : 'White'} wins ${
                sgState.stake.value
            }pt.`
        }
    }
}
