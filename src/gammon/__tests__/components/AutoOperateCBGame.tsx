import { CubefulMatchProps } from '../../components/apps/CubefulMatch'
import { CubefulGame, CubefulGameProps } from '../../components/CubefulGame'
import { BGEventHandlersExtensible } from '../../components/dispatchers/buildBGEventHandler'
import { operateWithBG } from '../../components/operateWithBG'

export function AutoOperateCBGame(
    props: CubefulGameProps &
        Pick<CubefulMatchProps, 'autoOperators'> &
        BGEventHandlersExtensible
) {
    const { bgState, autoOperators, ...handlers } = props
    const _bg: BGEventHandlersExtensible = { ...handlers }
    const _handlers = operateWithBG(autoOperators ?? {}, _bg)
    return <CubefulGame {...{ ...props, ..._handlers }} />
}
