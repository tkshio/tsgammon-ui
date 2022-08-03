import { toPositionIDFromArray } from 'tsgammon-core/utils/toPositionID'
import './positionID.css'

type PositionIDProps = { points: number[]}

export function PositionID(props: PositionIDProps) {
    const positionID = toPositionIDFromArray(props.points)
    return <div id={'positionID'}>PositionID: {positionID}</div>
}
