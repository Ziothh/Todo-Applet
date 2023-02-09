import { Todo } from "@prisma/client"
import { Form, Formik } from "formik"
import {toast, } from "react-toastify"
import { useRouter } from "next/router"
import { useRef } from "react"
import { useEffect } from "react"
import {toFormikValidationSchema} from "zod-formik-adapter"
import { TODO_VALIDATORS } from "../../shared/validators/todo.validators"
import { useMutation, useQuery, useTrpcCtx } from "../../utils/trpc"
import Input from "../form/Input"
import { Routes } from "../../utils/routes"

type Props<Mode extends "create" | "update"> = {
    mode: Mode
} 
& (
    Mode extends "update" 
    ? {
        todoId: Todo["id"]
    } 
    : {}
)

const formValidator = toFormikValidationSchema(TODO_VALIDATORS.todo.create)

const initialValues: Omit<Todo, "createdAt" | "updatedAt" | "id" | "order" | "isCompleted"> = {
    name: "",
    description: "",
    // isCompleted: false,
}

const TodoBaseForm = <Mode extends "create" | "update">(props: Props<Mode>): JSX.Element => {
    const {mode} = props
    const todoId: string = props.mode === "update" 
    // @ts-ignore
    ? props.todoId
    : "new"

    const router = useRouter()
    const trpcCtx = useTrpcCtx()
    const {data: todoToUpdate, isLoading} = mode === "create" 
    ? {data: undefined as Todo | undefined, isLoading: false} 
    : useQuery(["todo.getOne", {id: todoId}])

    const {mutateAsync} = useMutation(mode === "create" ? "todo.create" : "todo.update", {
        onSuccess(data, variables, context) {
            trpcCtx.setQueryData(["todo.getAll"], 
                prev => mode === "create"
                ? [...prev!, data]
                : prev!.map(
                    t => t.id === data.id 
                    ? {...data}
                    : t
                )
            )

        },
        onMutate(variables) {
            router.push(Routes.TODOS)
        },
        onError(error, variables, context) {
            router.push(Routes.TODOS + todoId)
        },
    })

    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (formRef.current === null) return

        (formRef.current.firstElementChild! as HTMLElement).focus()
    }, [formRef])

    return (
        <Formik onSubmit={async (values, helpers) => toast.promise(
            mutateAsync(values,),
            {
                pending: "Submitting...",
                success: `Todo was successfully ${mode}d!`,
                error: `Failed to ${mode} a todo.`
            }
        )} 
        validationSchema={formValidator}
        initialValues={todoToUpdate === undefined ? initialValues : todoToUpdate}
        enableReinitialize
        >
            <Form ref={formRef} className="flex flex-col gap-4">
                <Input name="name" label="Name" placeholder={isLoading ? "Laden..." : "My todo"} />
                <Input name="description" label="Description" placeholder={isLoading ? "Laden..." : "A short description..."} tag="textarea" rows={5}/>
                <input type="submit" value="Submit" 
                className="btn btn-primary"
                />
            </Form>
        </Formik>
    )
}


export default TodoBaseForm