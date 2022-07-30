import { Fragment, useState } from 'react'
import { DicePip, honsugorokuConf, standardConf } from 'tsgammon-core'
import {
    bothCBAutoOperator,
    bothSGAutoOperator,
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../operators/autoOperators'
import {
    bothRSAutoOperator,
    redRSAutoOperator,
    whiteRSAutoOperator,
} from '../operators/RSAutoOperators'
import { defaultPlayersConf, PlayersConf } from '../PlayersConf'
import { Button } from '../uiparts/Button'
import { Buttons } from '../uiparts/Buttons'
import { Dialog } from '../uiparts/Dialog'
import { CubefulMatch, CubefulMatchProps } from './CubefulMatch'

import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import {
    GameSetup,
    GameStatus,
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { decodePositionID } from 'tsgammon-core/utils/decodePositionID'
import { BoardEventHandlers } from '../boards/Board'
import './bgMain.css'
import { Cubeless } from './Cubeless'

export type BGMainProps = Partial<
    BGListener &
        RollListener &
        SingleGameListener &
        CheckerPlayListeners &
        BoardEventHandlers
>
const matchChoiceSet = {
    Unlimited: { len: 0 },
    '1pt': { len: 1 },
    '3pt': { len: 3 },
    '5pt': { len: 5 },
    '7pt': { len: 7 },
    Cubeless: { len: 0 },
}
type MatchChoice = keyof typeof matchChoiceSet
const matchChoice: MatchChoice[] = [
    'Unlimited',
    '1pt',
    '3pt',
    '5pt',
    '7pt',
    'Cubeless',
]
const defaultChoice: MatchChoice = '3pt'
const gameConfSet = {
    standard: {
        conf: standardConf,
        name: standardConf.name,
        forceCubeless: false,
    },
    honSugoroku: {
        conf: honsugorokuConf,
        name: honsugorokuConf.name,
        forceCubeless: true,
    },
}
type RuleLabel = keyof typeof gameConfSet
type BGMainState = BGMainConfState | BGMainPlayState
type _BGMainState = {
    autoOp: { red: boolean; white: boolean }
    playersConf: PlayersConf
    selected: MatchChoice
    recordMoves: boolean
    rule: RuleLabel
    position: {
        positionID: string
        isValid: boolean
        toPlay: 'OPENING' | 'RED' | 'WHITE'
        presetRoll: boolean
        dice1: DicePip
        dice2: DicePip
    }
}

type BGMainConfState = _BGMainState & {
    tag: 'CONF'
}
type BGMainPlayState = _BGMainState & {
    tag: 'PLAY'
    isTerminating: boolean
}
export function BGMain(props: BGMainProps) {
    const { ...exListeners } = props
    const labels = { red: 'Red', white: 'White' }
    const [matchKey, setMatchKey] = useState(0)
    const initialConf: BGMainConfState = {
        tag: 'CONF',
        autoOp: { red: true, white: false },
        playersConf: defaultPlayersConf,
        selected: defaultChoice,
        recordMoves: true,
        rule: 'standard',
        position: {
            isValid: true,
            positionID: '',
            toPlay: 'OPENING',
            presetRoll: false,
            dice1: 1,
            dice2: 1,
        },
    }
    const [state, setState] = useState<BGMainState>(initialConf)
    function toGameSetup(state: BGMainState): GameSetup {
        const { position } = state
        const absPos =
            state.position.positionID.length === 0
                ? gameConfSet[state.rule].conf.initialPos
                : decodePositionID(position.positionID).points
        if (position.toPlay === 'OPENING') {
            return {
                gameStatus: GameStatus.OPENING,
                absPos,
            }
        }
        if (position.toPlay === 'RED') {
            return position.presetRoll
                ? {
                      gameStatus: GameStatus.INPLAY_RED,
                      absPos,
                      dice1: position.dice1,
                      dice2: position.dice2,
                  }
                : {
                      gameStatus: GameStatus.TOROLL_RED,
                      absPos,
                  }
        }
        return position.presetRoll
            ? {
                  gameStatus: GameStatus.INPLAY_WHITE,
                  absPos,
                  dice1: position.dice1,
                  dice2: position.dice2,
              }
            : {
                  gameStatus: GameStatus.TOROLL_WHITE,
                  absPos,
              }
    }
    if (state.tag === 'CONF') {
        return (
            <div id="conf">
                <h2>Configuration</h2>
                <h3>Record Moves</h3>
                {recordMovesConf(state)}
                <h3>Match Point</h3>
                {matchPointConf(state)}
                <p />
                <h3>Players name</h3>
                {playersConf(state)}
                <h3>CPU plays</h3>
                {autoOpConf(state)}
                <h3>Rule</h3>
                {gameRuleConf(state)}
                <h3>Position</h3>
                {positionConf(state)}
                <hr />
                <Button
                    id="startBGMatch"
                    onClick={() => {
                        const newState: BGMainPlayState = {
                            ...state,
                            tag: 'PLAY',
                            selected: state.selected,
                            isTerminating: false,
                        }
                        setState(newState)
                    }}
                />
            </div>
        )
    } else {
        const gameSetup: GameSetup = toGameSetup(state)
        const bgMatchProps: CubefulMatchProps = {
            ...exListeners,
            gameConf: gameConfSet[state.rule].conf,
            onEndOfMatch: () => onEndOfMatch(state),
            playersConf: state.playersConf,
            autoOperators: autoOp(state),
            dialog: state.isTerminating ? terminateDialog(state) : undefined,
            matchLength: matchChoiceSet[state.selected].len,
            recordMatch: state.recordMoves,
            gameSetup,
        }

        if (state.selected === 'Cubeless') {
            return (
                <Fragment>
                    <Cubeless {...bgMatchProps} key={matchKey} />
                    {autoOpConf(state)}
                    {!state.isTerminating && (
                        <Button
                            id="term"
                            onClick={() => {
                                setState({ ...state, isTerminating: true })
                            }}
                        />
                    )}
                </Fragment>
            )
        }
        return (
            <Fragment>
                <CubefulMatch {...bgMatchProps} key={matchKey} />
                <div id="conf">
                    {autoOpConf(state)}
                    {!state.isTerminating && (
                        <Button
                            id="term"
                            onClick={() => {
                                setState({ ...state, isTerminating: true })
                            }}
                        />
                    )}
                </div>
            </Fragment>
        )
    }
    function recordMovesConf(state: BGMainConfState) {
        const id = 'recordMoves'
        return (
            <Fragment>
                <input
                    type="checkbox"
                    id={id}
                    value={id}
                    checked={state.recordMoves}
                    onChange={() => {
                        const nextState = {
                            ...state,
                            recordMoves: !state.recordMoves,
                        }
                        setState(nextState)
                    }}
                />
                <label htmlFor={id}>record moves</label>
            </Fragment>
        )
    }
    function autoOp(state: BGMainState) {
        const conf = state.autoOp
        if (conf.red && conf.white) {
            return {
                cb: bothCBAutoOperator(),
                sg: bothSGAutoOperator(),
                rs: bothRSAutoOperator(),
            }
        }
        if (conf.red) {
            return {
                cb: redCBAutoOperator(),
                sg: redSGAutoOperator(),
                rs: redRSAutoOperator(),
            }
        }
        if (conf.white) {
            return {
                cb: whiteCBAutoOperator(),
                sg: whiteSGAutoOperator(),
                rs: whiteRSAutoOperator(),
            }
        }
        return undefined
    }

    function autoOpConf(state: BGMainState) {
        return (
            <Fragment>
                {checkBox('red')}
                {checkBox('white')}
            </Fragment>
        )
        function checkBox(id: 'red' | 'white') {
            return (
                <Fragment>
                    {' '}
                    <input
                        type="checkbox"
                        id={id}
                        value={id}
                        checked={state.autoOp[id]}
                        onChange={() =>
                            setState({
                                ...state,
                                autoOp: {
                                    ...state.autoOp,
                                    [id]: !state.autoOp[id],
                                },
                            })
                        }
                    />
                    <label htmlFor={id}>{labels[id]}</label>
                </Fragment>
            )
        }
    }
    function onEndOfMatch(state: BGMainState) {
        setMatchKey((prev) => prev + 1)
        setState({ ...state, tag: 'CONF', selected: state.selected })
    }

    function matchPointConf(state: BGMainConfState) {
        return (
            <Fragment>
                {matchChoice.map((value: MatchChoice) =>
                    confItem(state, value)
                )}
            </Fragment>
        )
        function confItem(conf: BGMainConfState, value: MatchChoice) {
            return (
                <Fragment key={value}>
                    <input
                        type="radio"
                        name="gameConf"
                        id={value}
                        value={value}
                        checked={conf.selected === value}
                        disabled={
                            gameConfSet[conf.rule].forceCubeless &&
                            value !== 'Cubeless'
                        }
                        onChange={() => {
                            const nextState: BGMainConfState = {
                                ...conf,
                                tag: 'CONF',
                                selected: value,
                            }
                            setState(nextState)
                        }}
                    />
                    <label htmlFor={value}>{value}</label>
                </Fragment>
            )
        }
    }

    function terminateDialog(curState: BGMainPlayState) {
        return (
            <Dialog id={'termDialog'}>
                <Fragment>
                    <div className="csscaption" />{' '}
                    <Buttons>
                        <Button
                            id="execTerm"
                            onClick={() => onEndOfMatch(curState)}
                        />
                        <Button
                            id="cancelTerm"
                            onClick={() => {
                                setState({
                                    ...curState,
                                    isTerminating: false,
                                })
                            }}
                        />
                    </Buttons>
                </Fragment>
            </Dialog>
        )
    }
    function playersConf(state: BGMainState) {
        const ids: ('red' | 'white')[] = ['red', 'white']
        return ids.map((id: 'red' | 'white') => {
            return (
                <Fragment key={id}>
                    <label htmlFor={id}>{labels[id]}: </label>
                    <input
                        id={id}
                        type="field"
                        value={state.playersConf[id].name}
                        onChange={(e) => {
                            setState({
                                ...state,
                                playersConf: {
                                    ...state.playersConf,
                                    [id]: { name: e.target.value },
                                },
                            })
                        }}
                    />
                </Fragment>
            )
        })
    }
    function gameRuleConf(state: BGMainConfState) {
        const rules: RuleLabel[] = Object.getOwnPropertyNames(
            gameConfSet
        ) as RuleLabel[]
        return (
            <Fragment>
                {rules.map((s: RuleLabel) => confItem(state, s))}
            </Fragment>
        )
        function confItem(conf: BGMainConfState, value: RuleLabel) {
            const gameConf = gameConfSet[value]
            return (
                <Fragment key={value}>
                    <input
                        type="radio"
                        name="ruleConf"
                        id={value}
                        value={value}
                        checked={conf.rule === value}
                        onChange={() => {
                            const nextState: BGMainConfState = {
                                ...conf,
                                rule: value,
                                selected: gameConf.forceCubeless
                                    ? 'Cubeless'
                                    : conf.selected,
                                position: {
                                    ...conf.position,
                                    toPlay:
                                        value === 'honSugoroku'
                                            ? 'RED'
                                            : 'OPENING',
                                },
                            }
                            setState(nextState)
                        }}
                    />
                    <label htmlFor={value}>{gameConf.name}</label>
                </Fragment>
            )
        }
    }

    function positionConf(state: BGMainConfState) {
        return (
            <Fragment>
                <div>
                    <label htmlFor="position">PositionID: </label>
                    <input
                        id="position"
                        type="field"
                        value={state.position.positionID}
                        onChange={(position) => {
                            setState({
                                ...state,
                                position: {
                                    ...state.position,
                                    positionID: position.target.value,
                                    isValid: true,
                                },
                            })
                        }}
                    />
                    <Button id="reset_posID" onClick={()=>{
                        setState({
                            ...state,
                            position:{
                                ...state.position,
                                positionID:''
                            }
                        })
                    }}>reset</Button>
                </div>
                {setupConf(state)}
            </Fragment>
        )

        function setupConf(state: BGMainConfState) {
            const position = state.position
            const onChange = (s: 'RED' | 'WHITE' | 'OPENING') => () => {
                const nextState: BGMainConfState = {
                    ...state,
                    position: {
                        ...position,
                        toPlay: s,
                    },
                }
                setState(nextState)
            }
            return (
                <Fragment>
                    <input
                        type="radio"
                        name="setupConf"
                        id="setupConf_opening"
                        value="OPENING"
                        checked={position.toPlay === 'OPENING'}
                        onChange={onChange('OPENING')}
                    />
                    <label htmlFor="setupConf_opening">Opening</label>
                    <input
                        type="radio"
                        name="setupConf"
                        id="setupConf_red"
                        value="RED"
                        checked={position.toPlay === 'RED'}
                        onChange={onChange('RED')}
                    />
                    <label htmlFor="setupConf_red">Red to Play</label>
                    <input
                        type="radio"
                        name="setupConf"
                        id="setupConf_white"
                        value="WHITE"
                        checked={position.toPlay === 'WHITE'}
                        onChange={onChange('WHITE')}
                    />
                    <label htmlFor="setupConf_white">White to Play</label>
                    <br />
                    <input
                        type="checkbox"
                        id="setupConf_presetRoll"
                        checked={position.presetRoll}
                        disabled={state.position.toPlay === 'OPENING'}
                        onChange={(e) => {
                            const nextState: BGMainConfState = {
                                ...state,
                                position: {
                                    ...state.position,
                                    presetRoll: e.target.checked,
                                },
                            }
                            setState(nextState)
                        }}
                    />
                    <label htmlFor="setupConf_presetRoll">Preset Roll</label>
                    {state.position.presetRoll && (
                        <Fragment>
                            <br />
                            {diceConf('dice1')}
                            <br />
                            {diceConf('dice2')}
                        </Fragment>
                    )}
                </Fragment>
            )
        }

        function diceConf(label: 'dice1' | 'dice2') {
            const pips: DicePip[] = [1, 2, 3, 4, 5, 6]
            return (
                <Fragment>
                    {pips.map((d: DicePip) => (
                        <Fragment key={d}>
                            {' '}
                            <input
                                type="radio"
                                name={`diceConf${label}`}
                                id={`diceConf${label}_${d}`}
                                checked={state.position[label] === d}
                                onChange={() => {
                                    const nextState: BGMainConfState = {
                                        ...state,
                                        position: {
                                            ...state.position,
                                            [label]: d,
                                        },
                                    }
                                    setState(nextState)
                                }}
                            />
                            <label htmlFor={`diceConf${label}_${d}`}>{d}</label>
                        </Fragment>
                    ))}
                </Fragment>
            )
        }
    }
}
