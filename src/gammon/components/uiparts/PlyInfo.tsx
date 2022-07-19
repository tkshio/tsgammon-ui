import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { formatState } from 'tsgammon-core/dispatchers/utils/formatState'
import { Score } from 'tsgammon-core/Score'
import { formatScore } from 'tsgammon-core/utils/formatScore'
import './plyInfo.css'

export function PlyInfo(props: {
    cbState?: CBState
    sgState: SGState
    cpState?: CheckerPlayState
    score: Score
    matchLength?: number
}) {
    const { cbState, sgState, cpState, score, matchLength } = props

    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)
    const stateText = formatState(sgState, cbState, cpState)
    return (
        <div id={'plyAsText'}>
            <div className={'curPly'}>
                {ZERO_WIDTH_SPACE}
                {stateText}
            </div>
            <div className={'score'}>
                {formatScore(score)}
                {formatMatchLength(matchLength)}
            </div>
        </div>
    )

    function formatMatchLength(matchLength: number | undefined) {
        if (matchLength === undefined) {
            return ''
        }
        return (
            '  ' +
            (matchLength === 0
                ? '(Unlimited match)'
                : `(${matchLength}pt match)`)
        )
    }
}
