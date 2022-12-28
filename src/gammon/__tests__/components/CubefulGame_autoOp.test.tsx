import { render } from '@testing-library/react'
import { unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { standardConf } from 'tsgammon-core'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { matchStateForUnlimitedMatch } from 'tsgammon-core/MatchState'
import { CBInPlay } from 'tsgammon-core/states/CubeGameState'
import { SGInPlay } from 'tsgammon-core/states/SingleGameState'
import {
    GameSetup,
    GameStatus,
    toCBState,
    toSGState,
} from 'tsgammon-core/states/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame } from '../../components/CubefulGame'
import { operateWithBG } from '../../components/operateWithBG'
import { AutoOperateCBGame } from './AutoOperateCBGame'
import {
    BoardOp,
    isRed,
    isWhite,
    setupEventHandlers,
} from './CubefulGame.common'
import {
    noDoubleEngine,
    setRedAutoOp,
    setWhiteAutoOp,
} from './CubefulGame_autoOp.common'

let container: HTMLElement | null = null

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

const engine: GammonEngine = noDoubleEngine()
function setup(gameSetup?: GameSetup) {
    const bgState = {
        sgState: toSGState(gameSetup),
        cbState: toCBState(gameSetup),
    }
    const matchState = matchStateForUnlimitedMatch()
    const state = {
        matchState,
        cpState: undefined,
        bgState,
    }
    const diceSource = presetDiceSource(3, 1)
    const props = { ...setupEventHandlers(state, diceSource), ...state }
    return { props, bgState, matchState }
}

describe('CubeGameBoard(with autoOp)', () => {
    test('does opening roll and checkerPlay when dice gets clicked', async () => {
        const { props, bgState } = setup()
        render(
            <AutoOperateCBGame
                {...{ ...props, autoOperators: setRedAutoOp(engine) }}
            />
        )

        // 初期画面とオープニングロール
        await act(() => BoardOp.clickRightDice())

        // Redのプレイが終わり、Whiteのキューブアクション待ち
        expect(isWhite(bgState.cbState)).toBeTruthy()
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(bgState.sgState)).toBeTruthy()
    })

    test('lets whiteAutoPlayer do cubeAction', async () => {
        const { props, bgState } = setup({
            gameStatus: GameStatus.INPLAY_RED,
            // prettier-ignore
            absPos: [
                0,
                2,2,2,2,2,2,  -1,0,0,0,0,0,
                0,0,0,0,0,0,   0,0,0,0,0,0,
                0
            ],
            dice1: 2,
            dice2: 1,
        })

        const { sg, cb } = setWhiteAutoOp(engine)
        const autoOperators = {
            sg,
            cb: {
                ...cb,
                operateWhiteCubeAction: jest.fn(cb.operateWhiteCubeAction),
            },
        }
        const onRoll = jest.fn()
        const next = {
            ...props,
            ...operateWithBG(
                autoOperators,
                props.addListener({
                    onAwaitCheckerPlay: (_: {
                        cbState: CBInPlay
                        sgState: SGInPlay
                    }) => {
                        onRoll()
                    },
                })
            ),
        }
        render(<CubefulGame {...next} />)
        // 上記の盤面ではムーブがないので、クリックにより手番終了
        await act(BoardOp.clickLeftDice)
        // ダイスクリックしてロール
        await act(BoardOp.clickRightDice)

        // Whiteはキューブアクション、ロール、チェッカープレイまで済ませた
        expect(autoOperators?.cb?.operateWhiteCubeAction).toBeCalled()
        expect(onRoll).toBeCalled()
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(isRed(bgState.cbState)).toBeTruthy()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isRed(bgState.sgState)).toBeTruthy()
    })
    test('lets whiteAutoPlayer do checkerPlay', async () => {
        const { props, bgState } = setup({
            gameStatus: GameStatus.INPLAY_RED,
            // prettier-ignore
            absPos: [
                0,
                2,2,2,2,2,2,  -1,0,0,0,0,0,
                0,0,0,0,0,0,   0,0,0,0,0,0,
                0
            ],
            dice1: 1,
            dice2: 3,
        })
        const next = {
            ...props,
            autoOperators: setWhiteAutoOp(engine),
        }
        render(<AutoOperateCBGame {...next} />)
        // 上記の盤面ではムーブがないので、クリックにより手番終了
        await act(BoardOp.clickLeftDice)
        await act(BoardOp.clickRightDice)

        // Whiteはチェッカープレイを完了して、Redの手番
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(isRed(bgState.cbState)).toBeTruthy()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isRed(bgState.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do cubeAction', async () => {
        const { props, bgState } = setup({
            gameStatus: GameStatus.INPLAY_WHITE,
            // prettier-ignore
            absPos: [
                0,
                0,0,0,0,0,0,   0, 0, 0, 0, 0, 0,
                0,0,0,0,0,1,  -2,-2,-2,-2,-2,-2,
                0
            ],
            dice1: 1,
            dice2: 3,
        })
        const autoOperators = setRedAutoOp(engine)
        const next = {
            ...props,
            autoOperators: {
                ...autoOperators,
                cb: {
                    ...autoOperators.cb,
                    operateRedCubeAction: jest.fn(
                        autoOperators.cb.operateRedCubeAction
                    ),
                },
            },
        }

        render(<AutoOperateCBGame {...next} />)
        await act(BoardOp.clickRightDice)
        await act(BoardOp.clickLeftDice)
        // Redはロールして、チェッカープレイも完了した
        expect(next.autoOperators.cb.operateRedCubeAction).toBeCalled()
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(isWhite(bgState.cbState)).toBeTruthy()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(bgState.sgState)).toBeTruthy()
    })

    test('lets redAutoPlayer do roll', async () => {
        const { props, bgState } = setup({
            gameStatus: GameStatus.CUBEACTION_RED,
            absPos: standardConf.initialPos,
        })
        const next = {
            ...props,
            autoOperators: setRedAutoOp(engine),
        }
        render(<AutoOperateCBGame {...next} />)

        await act(BoardOp.clickRightDice)
        // ダイスクリックしてロール
        await act(BoardOp.clickLeftDice)

        // Redのプレイが完了した
        expect(bgState.cbState.tag).toEqual('CBAction')
        expect(isWhite(bgState.cbState)).toBeTruthy()
        expect(bgState.sgState.tag).toEqual('SGToRoll')
        expect(isWhite(bgState.sgState)).toBeTruthy()
    })
})

afterEach(() => {
    // clean up DOM
    if (container) {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    }
})
