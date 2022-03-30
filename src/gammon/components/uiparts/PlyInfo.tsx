import { Score } from 'tsgammon-core/Score';
import { formatScore } from 'tsgammon-core/utils/formatScore';
import { CheckerPlayState } from '../../dispatchers/CheckerPlayState';
import { CBState } from '../../dispatchers/CubeGameState';
import { SGState } from '../../dispatchers/SingleGameState';
import { formatState } from '../../dispatchers/utils/formatState';

import './plyInfo.css';



export function PlyInfo(props: { cbState?: CBState, sgState: SGState, cpState?: CheckerPlayState, score: Score }) {
    const { cbState, sgState, cpState, score } = props

    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)
    const stateText = formatState(sgState, cbState, cpState)
    return (
        <div id={"plyAsText"}>
            <div className={"curPly"}>{ZERO_WIDTH_SPACE}{stateText}</div>
            <div className={"score"}>{formatScore(score)}</div>
        </div>
    );
}
