import {BoardState, initBoardState} from "./BoardState";
import {DicePip, Dices, dices} from "./Dices";

type NoMove = { hasValue: false }
const NO_MOVE: NoMove = {hasValue: false}

/**
 * 相対表記で表した指し手。BoardStateの操作に使用する。
 * 外部出力にあたっては、GameStateがAbsoluteMoveに変換して提供するので、そちらを使用する。
 */
export type Move = {
    isOverrun: Boolean;
    isBearOff: boolean;
    isHit: boolean;
    from: number
    to: number
    pip: number
}

export type Moves = {
    moves: Move[]
    isRedundant: boolean
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

    /** ツリー端のノードで、同一局面でisRedundant=falseなノードが既に存在している場合true */
    isRedundant: boolean;
}

/**
 * BoardStateNodeのツリーをたどって、Move[]（あるロールを使い切る手）の配列、
 * すなわちそのBoardStateNodeの局面で可能な選択肢の列挙を返す
 * @param node
 */
export function collectMoves(node: BoardStateNode): Moves[] {
    const hasUnusedDice = node.dices.find(dice => !dice.used)
    if (hasUnusedDice) {
        const bMajor: Moves[] = node.board.points()
            .map((_, idx) =>
                node.majorFirst(idx))
            .map(node => node.hasValue ? collectMoves(node) : [])
            .flat();
        const bMinor: Moves[] = node.board.points().map((_, idx) => node.minorFirst(idx)).map(node => node.hasValue ? collectMoves(node) : []).flat();

        return bMajor.concat(bMinor)
    } else {
        return [{moves: node.lastMoves(), isRedundant: node.isRedundant}]
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
        lastMoves: () => [],
        isRedundant: false
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

    function applyDices(firstDice: DicePip, secondDice: DicePip,
                        isRedundantFunc: (moves: Move[]) => boolean = () => false) {
        const dicesAfterUse = [{
            ...firstDice,
            used: true
        }]

        const nodeBuilder =
            (board: BoardState, moves: Move[]) => buildLeaveNodesAndParent(
                board, dicesAfterUse, secondDice, moves, isRedundantFunc
            )

        return applyDicePipToPoints(
            board, firstDice.pip, [], nodeBuilder, 2)

    }

    // 大きい目を先に使った場合の候補手は、冗長扱いしない
    const [majorTmp, majorMarked] = applyDices(majorDice, minorDice);

    // 小さい目の場合、冗長判定がある
    const isRedundantFunc = (moves: Move[]) => {
        if (moves.length !== 2) {
            // 2手なければ、冗長かどうかは気にしない
            return false
        }
        // 1. 同じところから二つの駒を動かす場合、冗長（majorに含まれている）
        if (moves[0].from === moves[1].from) {
            return true
        }
        // 2. 同じ駒を2回動かすムーブで、かつダイスを入れ替えた場合のムーブと合わせて
        // 片方だけがヒットの場合、冗長ではない
        if (moves[0].to === moves[1].from) {
            const isHit = moves[0].isHit
            const swappedMovesNode = majorTmp(moves[0].from)
            if (swappedMovesNode.hasValue) {

                //2'. 大→小の順では同じピースを二回続けて動かせていない場合冗長ではない
                {
                    const majorPip = moves[1].pip
                    const swappedMoveTo = moves[0].from + majorPip
                    if (!swappedMovesNode.majorFirst(swappedMoveTo).hasValue) {
                        return false
                    }
                }
                const swappedMove = swappedMovesNode.lastMoves()[0]
                // どちらもヒットか、どちらもヒットでない場合は、冗長
                return (isHit && swappedMove.isHit) ||
                    (!isHit && !swappedMove.isHit)
            } else {
                return false
            }
        }


        // 3. 一手目によりlastPosが変わる場合、冗長ではない
        if (moves[0].from === board.lastPiecePos() &&
            board.piecesAt(moves[0].from) === 1 &&
            moves[1].isOverrun
        ) {
            return false
        }
        // 3'. 一手目で初めてベアオフが可能となり、二手目がベアオフの場合、冗長ではない
        if (!board.isBearable() && moves[1].isBearOff) {
            return false
        }


        // 4. 一手目がリエントリーで、かつバー上の駒がそれだけの場合は冗長でない
        if (moves[0].from === 0 &&
            board.piecesAt(0) === 1) {
            return false;
        }
        return true
    }
    const [minorTmp, minorMarked] = applyDices(minorDice, majorDice, isRedundantFunc)

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
        lastMoves: () => [],
        isRedundant: false

    }
}

// buildNodes()で構築するツリーの、最末端ノードを構築する
// すなわち、最後の一つのダイスを各ポイントに適用した結果を返す
function buildLeaveNodesAndParent(board: BoardState,
                                  usedDices: Dices,
                                  lastDice: DicePip,
                                  lastMoves: Move[],
                                  isRedundantFunc: (moves: Move[]) => boolean = () => false)
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
                    lastMoves: () => moves,
                    isRedundant: isRedundantFunc(moves)
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
        lastMoves: () => lastMoves,
        isRedundant: false
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
    return [pos => nodes[pos] ?? NO_MOVE, markedMin];
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
                    from: pos,
                    to: pos + dicePip,
                    pip: dicePip,
                    isHit: opponent === 1,
                    isBearOff: false,
                    isOverrun: false
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
        {
            isLegal: true,
            move: {
                from: pos,
                to: pos + dicePip,
                pip: dicePip,
                isHit: false,
                isBearOff: true,
                isOverrun: moveTo > bearOffPos
            }
        } :
        {isLegal: false}
}

// 与えられた盤面、ダイスから、可能なムーブと、その適用後のダイスのペアをすべて列挙する
function buildNodesForDoublet(board: BoardState, dices: Dices): BoardStateNode {
    const [node,] = buildNodesForDoubletRec(board, [], dices, [])
    return node
}

// 与えられた盤面、ダイスから、可能なムーブと、その適用後のダイスのペアをすべて列挙する
function buildNodesForDoubletRec(board: BoardState, usedDices: Dices, unusedDices: Dices, lastMoves: Move[], isAlreadyRedundant: boolean = false): [BoardStateNode, number] {

    const nodeBuilder = unusedDices.length === 2 ? nodeBuilderForLeaves() : nodeBuilderRec()

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
        lastMoves: () => lastMoves,
        isRedundant: false
    }, marked]


    function nodeBuilderForLeaves() {
        return (b: BoardState, moves: Move[]) => {
            const isRedundant = isAlreadyRedundant ||
                lastMoveIsRedundant(moves)

            const isRedundantFunc = isRedundant ? () => true :
                (moves: Move[]) => isRedundant || lastMoveIsRedundant(moves)

            return buildLeaveNodesAndParent(b, usedDices.concat({
                pip: unusedDices[0].pip,
                used: true
            }), unusedDices[1], moves, isRedundantFunc)
        }
    }

    function nodeBuilderRec() {
        return (b: BoardState, moves: Move[]) => {
            const isRedundant = isAlreadyRedundant ||
                lastMoveIsRedundant(moves)

            return buildNodesForDoubletRec(b, usedDices.concat({
                pip: unusedDices[0].pip,
                used: true
            }), unusedDices.slice(1), moves, isRedundant)
        }
    }

    // 最後に適用した手が、それまでに適用した手より手前の駒を動かす場合は、冗長なムーブ
    function lastMoveIsRedundant(moves: Move[]): boolean {
        return ((moves.length > 1) &&
            (moves[moves.length - 2].from > moves[moves.length - 1].from))
    }
}
