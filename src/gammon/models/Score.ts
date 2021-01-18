export type Score = {
    whiteScore: number,
    redScore: number,
    add(score: Score): Score
}

export function score(value: { redScore?: number, whiteScore?: number } = {redScore: 0, whiteScore: 0}): Score {
    return {
        redScore: value.redScore ?? 0,
        whiteScore: value.whiteScore ?? 0,
        add(score) {
            return {
                ...this,
                redScore: this.redScore + score.redScore,
                whiteScore: this.whiteScore + score.whiteScore
            };
        }
    }
}