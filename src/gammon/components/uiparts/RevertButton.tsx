import './revertButton.css'

type RevertButtonProps = JSX.IntrinsicElements['div'] & {
    mode?: 'undo' | 'redo'
}

/**
 * やり直しボタンを描画するコンポーネント
 * @param prop
 * @constructor
 */
export function RevertButton(prop: RevertButtonProps) {
    return <div className={'revertButton'} {...prop} />
}
