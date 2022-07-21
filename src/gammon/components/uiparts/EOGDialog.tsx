import { EOGStatus, Score } from 'tsgammon-core'
import { formatScore } from 'tsgammon-core/utils/formatScore'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import { Dialog } from './Dialog'
import { defaultPlayersConf, PlayersConf } from './PlayersConf'

export type EOGDialogProps = {
    stake: Score
    eogStatus: EOGStatus
    score: Score
    matchLength?: number
    isCrawfordNext?: boolean
    isEoM?: boolean
    playersConf?: PlayersConf
    onClick: () => void
}

export function EOGDialog(props: EOGDialogProps) {
    const {
        stake,
        eogStatus: eog,
        score,
        matchLength,
        isCrawfordNext = false,
        isEoM = false,
        playersConf = defaultPlayersConf,
        onClick,
    } = { ...props }
    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)
    const msgs = [
        matchLength ? `${matchLength} points match` : 'Unlimited match',
        ZERO_WIDTH_SPACE,
        formatStake(stake, eog, playersConf.red.name, playersConf.white.name) +
            (isEoM ? ' and won the match' : ''),
        formatScore(score, playersConf.red.name, playersConf.white.name),
        !isEoM && matchLength && isCrawfordNext
            ? '(next game is crawford game)'
            : ZERO_WIDTH_SPACE,
    ]

    return <Dialog msgs={msgs} onClick={onClick} />
}
