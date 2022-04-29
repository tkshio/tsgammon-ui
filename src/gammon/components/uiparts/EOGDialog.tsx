import { EOGStatus, Score } from 'tsgammon-core'
import { formatScore } from 'tsgammon-core/utils/formatScore'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import { Dialog } from './Dialog'

export type EOGDialogProps = {
    stake: Score
    eogStatus: EOGStatus
    score: Score
    matchPoint?: number
    isCrawfordNext?: boolean
    onClick: () => void
}

export function EOGDialog(props: EOGDialogProps) {
    const {
        stake,
        eogStatus: eog,
        score,
        matchPoint,
        isCrawfordNext = false,
        onClick,
    } = { ...props }
    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)

    const msgs = [
        matchPoint ? `${matchPoint} points match` : 'Unlimited match',
        ZERO_WIDTH_SPACE,
        formatStake(stake, eog),
        formatScore(score),
        matchPoint && isCrawfordNext
            ? 'next game is crawford'
            : ZERO_WIDTH_SPACE,
    ]

    return <Dialog msgs={msgs} onClick={onClick} />
}
