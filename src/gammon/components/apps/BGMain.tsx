import { Fragment, useState } from 'react'
import { Button } from '../uiparts/Button'
import { PointMatch, PointMatchProps } from './PointMatch'
import './bgMain.css'
import { Dialog } from '../uiparts/Dialog'
import { Buttons } from '../uiparts/Buttons'
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
import { defaultPlayersConf, PlayersConf } from '../uiparts/PlayersConf'

export type BGMainProps = {
    //
}
type MatchChoice = 'Unlimited' | '1pt' | '3pt' | '5pt'
const matchChoice: MatchChoice[] = ['Unlimited', '1pt', '3pt', '5pt']
const defaultChoice: MatchChoice = '3pt'

type BGMainState = BGMainConfState | BGMainPlayState
type _BGMainState = {
    autoOp: { red: boolean; white: boolean }
    playersConf: PlayersConf
}

type BGMainConfState = _BGMainState & {
    tag: 'CONF'
    selected: MatchChoice
}
type BGMainPlayState = _BGMainState & {
    tag: 'PLAY'
    selected: MatchChoice
    isTerminating: boolean
}
export function BGMain(props: BGMainProps) {
    const labels = {red:'Red', white:'White'}

    const [matchKey, setMatchKey] = useState(0)
    const [state, setState] = useState<BGMainState>({
        tag: 'CONF',
        autoOp: { red: true, white: false },
        playersConf: defaultPlayersConf,
        selected: defaultChoice,
    })

    if (state.tag === 'CONF') {
        return (
            <Fragment>
                <h2>Configuration</h2>
                <h3>Match Point</h3>
                {matchPointConf(state)}
                <p />
                <h3>Players name</h3>
                {playersConf(state)}
                <h3>CPU plays</h3>
                {autoOpConf(state)}
                <hr />
                <Button
                    id="startBGMatch"
                    onClick={() => {
                        setState({
                            ...state,
                            tag: 'PLAY',
                            selected: state.selected,
                            isTerminating: false,
                        })
                    }}
                />
            </Fragment>
        )
    } else {
        const pointMatchProps: PointMatchProps = {
            onEndOfMatch: () => onEndOfMatch(state),
            matchLength: toMatchPoint(state),
            playersConf: state.playersConf,
            autoOperators: autoOp(state),
            dialog: state.isTerminating ? terminateDialog(state) : undefined,
        }

        return (
            <Fragment>
                <PointMatch {...pointMatchProps} key={matchKey} />
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
                            onChange({
                                ...state.autoOp,
                                [id]: !state.autoOp[id],
                            })
                        }
                    />
                    <label htmlFor={id}>{labels[id]}</label>
                </Fragment>
            )
        }
        function onChange(autoOp: { red: boolean; white: boolean }) {
            setState({ ...state, autoOp })
        }
    }
    function onEndOfMatch(state: BGMainState) {
        setMatchKey((prev) => prev + 1)
        setState({ ...state, tag: 'CONF', selected: state.selected })
    }
    function toMatchPoint(state: BGMainState) {
        switch (state.selected) {
            case '1pt':
                return 1
            case '3pt':
                return 3
            case '5pt':
                return 5
            case 'Unlimited':
                return 0
        }
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
                <Fragment>
                    <input
                        type="radio"
                        name="gameConf"
                        id={value}
                        value={value}
                        checked={conf.selected === value}
                        onChange={() => {
                            setState({ ...conf, tag: 'CONF', selected: value })
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
                <p>
                    <label htmlFor={id}>{labels[id]}: </label>
                    <input
                        id={id}
                        type="field"
                        value={state.playersConf[id].name}
                        onChange={(e) => {
                            setState({ ...state,playersConf:{...state.playersConf, [id]:{name:e.target.value}} })
                        }}
                    />
                </p>
            )
        })
    }
}
