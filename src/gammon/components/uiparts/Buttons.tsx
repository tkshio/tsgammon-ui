import "./button.css"

export function Buttons(props:JSX.IntrinsicElements['div']) {
    return <div className="buttons">
        {props.children}
    </div>
}
