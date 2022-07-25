import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { operateWithBG } from '../operateWithBG'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { BGCommonProps } from './BGCommonProps'
import { useCubeful } from './useCubeful'

export type SimpleCubefulMatchProps = BGCommonProps & {
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
}

export function SimpleCubefulMatch(props: SimpleCubefulMatchProps) {
    const {
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
