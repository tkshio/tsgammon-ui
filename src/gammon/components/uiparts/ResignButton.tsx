import { IconButton } from './IconButton'

export function ResignButton(props: { onResign: () => void }) {
    return <IconButton onClick={props.onResign} id="resignButton" />
}
