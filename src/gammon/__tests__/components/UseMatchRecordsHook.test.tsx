import {act, renderHook} from '@testing-library/react-hooks'

import {initialStateBuilder} from "../../models/GameState";
import {Score, score} from "../../models/Score";
import {dicePip, dices} from "../../models/Dices";
import {useMatchRecords} from "../../components/UseMatchRecord";
import {gameStatus} from "../../models/GameStatus";


const initialMatchRecords = {
    scoreBefore: score(),
    curScore: score(),
    curPlyRecords: [],
    records: [],
}

test('update MatchRecord at EoG', () => {

    const {result} = renderHook(() => useMatchRecords(initialMatchRecords))
    const state = initialStateBuilder.buildCheckerPlayStatus(dicePip(0), dicePip(0), undefined, [])
    // 空（初期状態）
    {
        const matchRecords = result.current.matchRecord
        expect(toValue(matchRecords.scoreBefore)).toMatchObject(score())
        expect(toValue(matchRecords.curScore)).toMatchObject(score({redScore: 0, whiteScore: 0}))
        const plyRecords = result.current.matchRecord.curPlyRecords
        expect(plyRecords.length).toBe(0)
    }
    act(() => {
        result.current.reduceState(state, {type: "Commit"})
    })

    // ゲーム終了時（再開前）
    {
        const matchRecords = result.current.matchRecord

        expect(toValue(matchRecords.scoreBefore)).toMatchObject(score())
        expect(toValue(matchRecords.curScore)).toMatchObject(score({redScore: 0, whiteScore: 1}))
        const plyRecords = result.current.matchRecord.curPlyRecords
        expect(plyRecords.length).toBe(2) // last Commit and EoG
    }

    // ゲーム再開
    act(() => {
        result.current.commitCurPlyRecords()
    })
    // ゲーム再開により、現在の記録が転記され、次のゲームの記録が初期化される
    {
        const matchRecords = result.current.matchRecord

        expect(toValue(matchRecords.scoreBefore)).toMatchObject(score({redScore: 0, whiteScore: 1}))
        expect(toValue(matchRecords.curScore)).toMatchObject(score({redScore: 0, whiteScore: 1}))

        expect(result.current.matchRecord.curPlyRecords.length).toBe(0)
        expect(result.current.matchRecord.records.length).toBe(1)
    }
})
test('update MatchRecord twice at once', () => {
    const {result} = renderHook(() => useMatchRecords(initialMatchRecords))
    const state = initialStateBuilder.buildCheckerPlayStatus(dicePip(0), dicePip(0), {
        initialArrangement: [
            0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0
        ],
        jacobyRule: false
    }, [])

    act(() => {
        const s1 = result.current.reduceState(state, {type: "Commit"})
        expect(s1.status).toBe(gameStatus.endOfGame)
        result.current.commitCurPlyRecords()
        const s2 = result.current.reduceState(s1, {type: "Restart"})
        const s3 = result.current.reduceState(s2, {type: "StartGame"})
        const s4 = result.current.reduceState(s3, {type: "Roll", roll: dices(1, 2)})
        const lastState = result.current.reduceState(s4, {type: "Commit", force: true})
        expect(lastState.status).toBe(gameStatus.endOfGame)
        result.current.commitCurPlyRecords()
    })

    expect(result.current.matchRecord.records.length).toBe(2)
    const sc = result.current.matchRecord.curScore
    expect(toValue(sc)).toMatchObject({whiteScore: 4, redScore: 0})

})

function toValue(score: Score) {
    return {...score, add: expect.anything()}
}

