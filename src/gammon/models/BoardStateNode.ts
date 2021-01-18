import {BoardState, initBoardState} from "./BoardState";
import {DicePip, Dices, dices} from "./Dices";

type NoMove = { hasValue: false }
const NO_MOVE: NoMove = {hasValue: false}

/**
 * 相対表記で表した指し手。BoardStateの操作に使用する。
 * 外部出力にあたっては、GameStateがAbsoluteMoveに変換して提供するので、そちらを使用する。
 */
export type Move = {
    isHit: boolean;
    from: number
    to: number
    pip: number
}

/**
 * BoardStateとダイスの対にたいして、そこから可能な手をツリー構造で表現するオブジェクト
 */
export type BoardStateNode = {
    hasValue: true,
    dices: Dices
    board: BoardState
    /**
     * 指定されたポイントに、大きいほうの目のロールを適用した後の状態を返す
     * @param pos
     */
    majorFirst: (pos: number) => (BoardStateNode | NoMove)
    /**
     * 指定されたポイントに、小さいほうの目のロールを適用した後の状態を返す
     * @param pos
     */
    minorFirst: (pos: number) => (BoardStateNode | NoMove)

    /**
     * この局面にいたる直前までに適用した手。ロール直後の場合は空となる。
     */
    lastMoves(): Move[]
}

/**
 * BoardStateNodeのツリーをたどって、Move[]（あるロールを使い切る手）の配列、
 * すなわちそのBoardStateNodeの局面で可能な選択肢の列挙を返す
 * @param node
 */
export function collectMoves(node: BoardStateNode): Move[][] {
    const hasUnusedDice = node.dices.find(dice => !dice.used)
    if (hasUnusedDice) {
        const bMajor: Move[][] = node.board.points().map((_, idx) => node.majorFirst(idx)).map(node => node.hasValue ? collectMoves(node) : []).flat();
        const bMinor: Move[][] = node.board.points().map((_, idx) => node.minorFirst(idx)).map(node => node.hasValue ? collectMoves(node) : []).flat();
        return bMajor.concat(bMinor)
    } else {
        return [node.lastMoves()]
    }
}

/**
 * 与えられた盤面、ダイスから、可能なムーブと、その適用後のダイスのペアをすべて列挙する
 */
export function buildNodes(board: BoardState, dice1: DicePip, dice2: DicePip): BoardStateNode {
    if (dice1 === undefined || dice2 === undefined) {
        return nodeWithBlankDice(board)
    }
    return (dice1.pip !== dice2.pip) ?
        buildNodesForHeteroDice(board, [dice1, dice2]) :
        buildNodesForDoublet(board, [dice1, dice1, dice1, dice1])
}

/**
 * buildNodesと同様だが、直接各ポイントの駒数を格納した配列を引数に使用する。
 * 引数のポイントは相対表記を使用する
 */
export function buildNodesWith(pieces: number[],
                               dice1: DicePip, dice2: DicePip,
                               bornOffs: [number, number] = [0, 0]): BoardStateNode {
    const board = initBoardState(pieces, bornOffs)
    return buildNodes(board, dice1, dice2)
}

/**
 * 与えられた局面に対し、ダイスなし、可能な手なしのBoardStateNodeを生成する
 * @param board
 */
export function nodeWithBlankDice(board: BoardState): BoardStateNode {
    return {
        hasValue: true,
        dices: dices(0, 0),
        board: board,
        majorFirst: () => NO_MOVE,
        minorFirst: () => NO_MOVE,
        lastMoves: () => []
    };
}

// ゾロ目でないダイスのペアに対して、バックギャモンのルールに基づいて可能な手を列挙する
function buildNodesForHeteroDice(board: BoardState, dices: Dices): BoardStateNode {
    const majorDice = {
        pip: dices.map(d => d.pip as number).reduce((p1, p2) => Math.max(p1, p2)),
        used: false
    } as DicePip
    const minorDice = {
        pip: dices.map(d => d.pip as number).reduce((p1, p2) => Math.min(p1, p2)),
        used: false
    } as DicePip

    // 大きい目を先に使った場合の候補手と、その場合のmarked = 使えないロール目の数
    const [majorTmp, majorMarked] = applyDicePipToPoints(board, majorDice.pip, [], (b, m) => buildLeaveNodesAndParent(b, [{
        ...majorDice,
        used: true
    }], minorDice, m), 2)
    const [minorTmp, minorMarked] = applyDicePipToPoints(board, minorDice.pip, [], (b, m) => buildLeaveNodesAndParent(b, [{
        ...minorDice,
        used: true
    }], majorDice, m), 2)

    let major: (pos: number) => (BoardStateNode | NoMove)
    let minor: (pos: number) => (BoardStateNode | NoMove)
    let usableDice: Dices;

    // どちらかのmarkedが０なら、それを採用する：もう一方はmarkedが０の場合のみ採用
    if (majorMarked === 0) {
        major = majorTmp
        minor = (minorMarked === 0) ? minorTmp : () => NO_MOVE
        usableDice = dices
    } else if (minorMarked === 0) {
        minor = minorTmp
        major = () => NO_MOVE // majorMarked !== 0はすでに確定している
        usableDice = dices
    } else { // 2個使うことはできない場合
        // １個しか使えない場合は、大きい目から使う
        if (majorMarked === 1) {
            major = majorTmp
            minor = () => NO_MOVE
            usableDice = [majorDice, {...minorDice, used: true}]
        } else if (minorMarked === 1) {
            major = () => NO_MOVE
            minor = minorTmp
            usableDice = [minorDice, {...majorDice, used: true}]
        } else {
            major = () => NO_MOVE
            minor = () => NO_MOVE
            usableDice = [{...majorDice, used: true}, {...minorDice, used: true}]
        }
    }

    return {
        hasValue: true,
        dices: usableDice,
        board: board,
        majorFirst: major,
        minorFirst: minor,
        lastMoves: () => []
    }
}

// buildNodes()で構築するツリーの、最末端ノードを構築する
// すなわち、最後の一つのダイスを各ポイントに適用した結果を返す
function buildLeaveNodesAndParent(board: BoardState,
                                  usedDices: Dices,
                                  lastDice: DicePip,
                                  lastMoves: Move[])
    : [BoardStateNode, number] {

    const dicesUsedUp = usedDices.concat([{pip: lastDice.pip, used: true}])
    const isEog = board.eogStatus().isEndOfGame
    const [major, unusedDices] = isEog ? [() => NO_MOVE, 0] :
        applyDicePipToPoints(board, lastDice.pip, lastMoves, (boardAfter, moves) => {
                // 最後のダイス、lastDiceを適用した局面を表すノード
                return [{
                    hasValue: true,
                    dices: dicesUsedUp,
                    board: boardAfter,
                    majorFirst: () => NO_MOVE,
                    minorFirst: () => NO_MOVE,
                    lastMoves: () => moves
                }, 0/*最後のダイスが適用できたので、未使用のダイスは0*/]
            },
            // ここは末端の局面なので、ムーブできない場合は未使用のダイス＝1個を返す
            1)

    // applyDicePipToPointsは未使用のダイスの最小値を返すので、
    // どこかのポイントがムーブ可能であれば unusedDices = 0が、そうでなければ 1が返ってきている

    // 盤面が終了状態になっている場合は、残ったダイスを使えないとマークするとともに、
    // unusedDices=0として返すことで、すべてのダイスを使いきる手と同等に扱われるようにする
    return [{
        hasValue: true,
        dices: usedDices.concat([{pip: lastDice.pip, used: (unusedDices === 1 || isEog)}]),
        board: board,
        majorFirst: major,
        minorFirst: () => NO_MOVE,
        lastMoves: () => lastMoves
    }, unusedDices]
}


/**
 *
 * @param board 盤面
 * @param dicePip 盤面に対して使用したいダイス目
 * @param lastMoves その盤面に至るまでに適用したムーブ
 * @param nodeBuilder ダイスが適用可能なポイントについて、適用後の状態を表すノードを生成する関数
 * @param mark 未使用のダイスの数＝すべてのポイントについてダイスが適用できない場合、無効化されるダイスの個数
 * @returns 各ポイントへのダイス適用可否（可の場合は子ノード、否の場合はNoMove）を格納した配列と、無効化される（＝使用できなかった）ダイスの数、必ずmark以下の値が返る
 *
 * 返値の未使用のダイスの数は、この局面で全くダイスが適用できない場合はmarkがそのまま、そうでなければ、
 * 子局面全体でもっとも多くダイスが使える場合の値（＝使用できないダイスの最小値）が返る
 */
function applyDicePipToPoints(board: BoardState,
                              dicePip: number,
                              lastMoves: Move[],
                              nodeBuilder: (board: BoardState, moves: Move[]) => [(BoardStateNode | NoMove), number],
                              mark: number):
    [(pos: number) => (BoardStateNode | NoMove), number] {

    if (board.eogStatus().isEndOfGame) {
        return [() => NO_MOVE, mark]
    }

    // 各ポイントについて、そこの駒を動かす手が有効なら、nodeBuilderを呼んで子局面を生成する
    const nodesAndMarksForEachPoint: [(BoardStateNode | NoMove), number][] =
        board.points().map((_, index) => {
            // 各ポイントについて、指定のダイス目が使えるかどうか判断する
            const move = isLegalMove(board, index, dicePip);
            // 使えるポイントについては子ノードを生成し、そうでなければNO_MOVEを返す
            return (move.isLegal ?
                    nodeBuilder(board.movePiece(index, dicePip), lastMoves.concat(move.move)) :
                    [NO_MOVE, mark]
            )
        });

    // 使用不能なダイスの数については、最小値をとる
    const markedMin = nodesAndMarksForEachPoint.map(([, mark]) => mark)
        .reduce((m1, m2) => Math.min(m1, m2));

    // 値の組の配列で受け取っているので、分離
    // かつ、最大限ダイスを使える手に絞り込む
    const nodes = nodesAndMarksForEachPoint.map(([node, marked]) => {
        return marked === markedMin ? node : NO_MOVE
    });

// ここで、nodesの中からmarkedが最小値でない候補を削りたい、が、nodesから直接markedを取る手段がない
    return [pos => nodes[pos], markedMin];
}


function isLegalMove(board: BoardState, pos: number, dicePip: number): { isLegal: true, move: Move } | { isLegal: false } {
    // 始点に駒がなくては動かせない
    const pieces = board.piecesAt(pos)
    if (pieces <= 0) {
        return {isLegal: false}
    }

    const barPos = 0
    // オンザバーでは、バー上の駒以外動かせない
    if (board.piecesAt(barPos) > 0 && pos !== barPos) {
        return {isLegal: false}
    }

    const moveTo = pos + dicePip
    // ベアオフでない場合、行先がブロックされていなければ、合法なムーブ
    if (0 < moveTo && moveTo < board.bearOffPos()) {
        const opponent = -board.piecesAt(moveTo)
        return (opponent < 2) ?
            {
                isLegal: true, move: {
                    from: pos, to: pos + dicePip, pip: dicePip, isHit: opponent === 1
                }
            } :
            {isLegal: false}
    }

    // ベアオフする条件は満たされているか
    if (!board.isBearable()) {
        return {isLegal: false}
    }

    const bearOffPos = 25

    // ちょうどで上がるか、そうでなければ最後尾からでなくてはいけない
    return (moveTo === bearOffPos || pos === board.lastPiecePos()) ?
        {isLegal: true, move: {from: pos, to: pos + dicePip, pip: dicePip, isHit: false}} :
        {isLegal: false}
}

// 与えられた盤面、ダイスから、可能なムーブと、その適用後のダイスのペアをすべて列挙する
function buildNodesForDoublet(board: BoardState, dices: Dices): BoardStateNode {
    const [node,] = buildNodesForDoubletRec(board, [], dices, [])
    return node
}

// 与えられた盤面、ダイスから、可能なムーブと、その適用後のダイスのペアをすべて列挙する
function buildNodesForDoubletRec(board: BoardState, usedDices: Dices, unusedDices: Dices, lastMoves: Move[]): [BoardStateNode, number] {
    const nodeBuilder = unusedDices.length === 2 ?
        (b: BoardState, moves: Move[]) => buildLeaveNodesAndParent(b, usedDices.concat({
            pip: unusedDices[0].pip,
            used: true
        }), unusedDices[1], moves) :
        (b: BoardState, moves: Move[]) => buildNodesForDoubletRec(b, usedDices.concat({
            pip: unusedDices[0].pip,
            used: true
        }), unusedDices.slice(1), moves)
// 常にmark==unusedDices.length

    const [major, marked] = applyDicePipToPoints(board, unusedDices[0].pip, lastMoves, nodeBuilder, unusedDices.length)

    // unusedDicesから、末尾 marked個分は使えないのであらかじめマークする
    const markAfter = unusedDices.length - marked
    return [{
        hasValue: true,
        dices: usedDices.concat(unusedDices.map((dice, idx) => {
            return (idx < markAfter) ? dice : {...dice, used: true}
        })),
        board: board,
        majorFirst: major,
        minorFirst: () => NO_MOVE,
        lastMoves: () => lastMoves
    }, marked]
}
