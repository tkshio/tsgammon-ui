import { IconButton, IconButtonProps } from './IconButton'
import './revertButton.css'

type RevertButtonProps = IconButtonProps & {
    mode?: 'undo' | 'redo'
}

/**
 * やり直しボタンを描画するコンポーネント
 * @param prop
 * @constructor
 */
export function RevertButton(prop: RevertButtonProps) {
    return <IconButton id={'revertButton'} {...prop} />
}
