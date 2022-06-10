import { PointMatchProps } from '../../components/apps/PointMatch'
import { CubefulGame, CubefulGameProps } from '../../components/CubefulGame'
import { useCBAutoOperator } from '../../components/useCBAutoOperator'

export function AutoOperateCBGame(
    props: CubefulGameProps & Pick<PointMatchProps, 'autoOperators'>
) {
    const { bgState, autoOperators, ...handlers } = props
    const { cbState, sgState } = bgState
    useCBAutoOperator(cbState, sgState, autoOperators, handlers)
    return <CubefulGame {...props} />
}
