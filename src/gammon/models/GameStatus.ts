// gameStatusLabelsから、以下のconstを合成し、列挙のための型をつくる
/*
const gameStatus = {
    opening: {accept: <T>(t: DispatchOperator<T>) => t.opening()},
    cubeActionWhite: {accept: <T>(t: DispatchOperator<T>) => t.cubeActionWhite()},
    ...
};
 */

// 名前を列挙
const gameStatusLabels = [
    'initialized',
    'rollOpening',
    'endOfGame',
    //
    'cubeActionWhite',
    'cubeResponseRed',
    'rollDiceWhite',
    'checkerPlayWhite',
    'commitCheckerPlayWhite',
    //
    'cubeActionRed',
    'cubeResponseWhite',
    'rollDiceRed',
    'checkerPlayRed',
    'commitCheckerPlayRed'
] as const;

//  各状態に対する処理の定義を、上記の名前リストから生成する
// {opening()=>T, cubeActionWhite()=>T, ...}
/*
 * 各状態に対して、任意の型Tを返す関数の組
 */
export type DispatchOperator<T> = {
    [P in typeof gameStatusLabels[number]]: () => T
}

export function constantDispatchOperator<T>(t: T): DispatchOperator<T> {
    let ret = {}
    gameStatusLabels.forEach(key => {
        const typedKey = key as keyof DispatchOperator<T>
        ret = {...ret, [typedKey]: () => t}
    })

    return ret as DispatchOperator<T>
}


/* 配列を使わない場合
export const gameStatusLabels = {
    opening: {},
    ...
} as const;

export type DispatchOperator<T> = {
    [P in keyof typeof gameStatusLabels]: () => T
}
 */

//各状態ごとにDispatchOperatorの対応する関数を呼び出す機能を付与し、型とする
// { opening: accept<T>(t:DispatchOperator<T>):T, cubeActionWhite: ..., .....} というMapの型
/*
 * 盤面の進行状況と、それに応じて分岐する関数の組の定義
 */
type gameStatusType = {
    [P in typeof gameStatusLabels[number]]: {
        accept: <T>(t: DispatchOperator<T>) => T
        toString: () => string
        label: string
    }
}
// 上記の型に対応する定義の元となる定数セットの作成
/*
 *  盤面の進行状況を表す定数値
 */
export const gameStatus = function () {
    let ret = {};

    // ラベル名を関数にして詰めていく
    gameStatusLabels.forEach(key => {
        const typedKey = key as keyof DispatchOperator<any>;//"opening", ...;
        ret = {
            ...ret, [typedKey]: {
                accept: <T>(t: DispatchOperator<T>) => t[typedKey](),
                toString: () => key,
                label: key
            }
        }
    });
    return ret as gameStatusType
}();

//  得られた定数を型に変換する
/*
 * 盤面の進行状況を表す定数値の組を表す型
 */
export type GameStatus = typeof gameStatus[keyof typeof gameStatus];
