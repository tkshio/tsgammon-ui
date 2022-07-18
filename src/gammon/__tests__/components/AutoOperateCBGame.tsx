import { PointMatchProps } from '../../components/apps/PointMatch'
import { CubefulGame, CubefulGameProps } from '../../components/CubefulGame'
import { operateWithBG } from '../../components/operateWithBG'
import { BGEventHandlersExtensible } from 'tsgammon-core/dispatchers/buildBGEventHandler'

export function AutoOperateCBGame(
    props: CubefulGameProps &
        Pick<PointMatchProps, 'autoOperators'> &
        BGEventHandlersExtensible
) {
    const { bgState, autoOperators, ...handlers } = props
    const _bg: BGEventHandlersExtensible = { ...handlers }
    const _handlers = operateWithBG(autoOperators ?? {}, _bg)
    return <CubefulGame {...{ ...props, ..._handlers }} />
}
