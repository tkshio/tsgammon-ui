import { EOGStatus } from 'tsgammon-core/BoardState'
import { Score } from 'tsgammon-core/Score'
import { formatScore } from 'tsgammon-core/utils/formatScore'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import { Dialog } from './Dialog'

export type EOGDialogProps = {
    stake: Score
    eogStatus: EOGStatus
    score: Score
    onClick: () => void
}

export function EOGDialog(props: EOGDialogProps) {
    const { stake, eogStatus: eog, score, onClick } = { ...props }
    const msgs = [formatStake(stake, eog), formatScore(score)]

    return <Dialog msgs={msgs} onClick={onClick} />
}
