import classNames from "classnames"
import { PropsWithChildren } from "react"

interface Props {
    className?: string
}


const TodoLayout: React.FC<PropsWithChildren<Props>> = ({children, className}) => {
    return (
        <div className={classNames(`
        flex flex-col
        w-[800px] h-full
        rounded-md
        text-neutral-200
        bg-neutral-800 p-8 
        border border-neutral-900
        `, className)}>
            {children}
        </div>
    )
}


export default TodoLayout