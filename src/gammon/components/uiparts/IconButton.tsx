import './iconButton.css'

export type IconButtonProps = JSX.IntrinsicElements['div']

export function IconButton(props: IconButtonProps) {
    return <div className="iconButton" {...props} />
}
