import classNames from "classnames"
import { PropsWithChildren, useState } from "react"
import { useEffect } from "react"
import contextFactory, { withContext } from "../utils/react"

interface Props extends PropsWithChildren {
    defaultOpen?: boolean
    overlayClassName?: string
    contentClassName?: string
    onClose?: () => void
}

const [ModalCtx, useModalCtx] = contextFactory(() => {
    const [isOpen, setIsOpen] = useState(false)

    return {
        isOpen,
        setIsOpen,
        createHelpers: (options: {
            onClose?: () => void
            onOpen?: () => void
        }) => ({
            close: () => {
                setIsOpen(false)
                options.onClose?.()
            },
            open: () => {
                setIsOpen(true)
                options.onOpen?.()
            },

        })
    }
})

const useBodyOverflowHide = () => {
    const {isOpen, setIsOpen} = useModalCtx()

    useEffect(() => {
        (
            (document.scrollingElement as HTMLElement) 
            ?? document.documentElement
        ).style.overflow = isOpen
            ? "hidden"
            : ""
    }, [isOpen])
}




export {useModalCtx}

const Modal = withContext<Props>(({
    defaultOpen = false,
    contentClassName,
    overlayClassName,
    children,
    onClose,
}) => {
    useBodyOverflowHide()
    const {isOpen, createHelpers} = useModalCtx()

    const helpers = createHelpers({
        onClose
    })

    useEffect(() => {
        if (defaultOpen) helpers.open()
    }, [defaultOpen, helpers])

    useEffect(() => {
        if (isOpen) {
            const callback = (e: KeyboardEvent) => {
                if (e.key === "Escape") helpers.close()
            }
    
            window.addEventListener("keydown", callback)
    
            return () => window.removeEventListener("keydown", callback)
        }
    }, [isOpen])

    return (
        <div 
        onClick={(e) => {if (e.target === e.currentTarget) helpers.close()}}
        className={classNames(
        `
        center
        transition-default
        fixed top-0 left-0 w-screen h-screen
        backdrop-blur-md cursor-pointer
        `, 
        !isOpen && "opacity-0 pointer-events-none",
        // isOpen && ``, 
        overlayClassName
        )}
        >
            <div className={classNames(
                `
                w-[90vw] max-w-[500px] py-6 px-6
                rounded-md
                bg-neutral-900
                border border-neutral-700
                shadow-md 
                cursor-default
                `,
                contentClassName
            )}>
                {children}
            </div>
        </div>
    )
}, ModalCtx)


export default Modal