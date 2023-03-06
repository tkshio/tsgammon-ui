import { CubefulGame, CubefulGameProps } from '../components/CubefulGame'
import { operateWithBG } from '../components/operateWithBG'
import { CBOperator } from '../components/operators/CBOperator'
import { RSOperator } from '../components/operators/RSOperator'
import { SGOperator } from '../components/operators/SGOperator'
import { BGCommonProps } from './BGCommonProps'
import { useCubeful } from './useCubeful'

export type SimpleCubefulMatchProps = BGCommonProps & {
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
}

export function SimpleCubefulMatch(props: SimpleCubefulMatchProps) {
    const {
        gameConf,
        playersConf,
        autoOperators = { cb: undefined, sg: undefined },
        ...exListeners
    } = props
    const { bgState, cpState, cpListener, bgEventHandler, matchState } =
        useCubeful(props)

    const bgEventHandlerWithOP = operateWithBG(autoOperators, bgEventHandler)
    const cbProps: CubefulGameProps = {
        bgState,
        cpState,
        matchState,
        gameConf,
        playersConf,
        ...exListeners,
        ...bgEventHandlerWithOP,
        ...cpListener,
    }

    return (
        <div id="main">
            <div id="boardPane">
                <CubefulGame {...cbProps} />
            </div>
        </div>
    )
}
