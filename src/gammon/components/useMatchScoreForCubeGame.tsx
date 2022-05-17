import { useState } from 'react';
import { score, Score } from 'tsgammon-core';
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher';
import { CBEoG } from 'tsgammon-core/dispatchers/CubeGameState';
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf';


export function useMatchScoreForCubeGame(
    stakeConf: StakeConf = { jacobyRule: false }
): {
    matchScore: Score;
    matchScoreListener: Pick<CubeGameListeners, 'onEndOfCubeGame'>;
} {
    const [matchScore, setMatchScore] = useState(score());
    const onEndOfCubeGame = (cbEoG: CBEoG) => {
        setMatchScore((prev) => prev.add(cbEoG.calcStake(stakeConf).stake));
    };
    return { matchScore, matchScoreListener: { onEndOfCubeGame } };
}
