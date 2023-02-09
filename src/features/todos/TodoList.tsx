import { useMutation, useQuery, useTrpcCtx } from "../../utils/trpc"
import TodoListCard from "./TodoListCard"

import {useAutoAnimate} from "@formkit/auto-animate/react"
import { FaPlus } from "react-icons/fa"
import { useRouter } from "next/router"
import { Routes } from "../../utils/routes"
import TodoListCardPlaceholder from "./TodoListCardPlaceholder"
import { DragDropContext, DragDropContextProps, Draggable, Droppable } from "@hello-pangea/dnd"
import { toast } from "react-toastify"
import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { Todo } from "@prisma/client"
import useDebounce from "@ziothh/react-hooks/dist/effect/useDebounce"

interface Props {
    
}

const reorder = (list: Todo[], fromIndex: number, toIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed!);
  
    return result;
};

const useDraggableTodos = () => {
    const {isLoading, data, refetch, isRefetching} = useQuery(["todo.getAll"])
    const BACKUP = useMemo(() => [...(data ?? [] as Todo[])], [data])
    const [todos, setTodos] = useState<Todo[]>(data ?? [] as  Todo[]) 
    
    const trpcCtx = useTrpcCtx()


    const reorderMutation = useMutation("todo.reorder", {
        onError(error, variables, context) {
            toast.error("Something went wrong whilst reordering your todos")
            trpcCtx.setQueryData(["todo.getAll"], BACKUP)
            refetch()
        },
    })

    useDebounce(() => {
        if (isLoading || isRefetching) return

        // TODO: fix this running on page load.
        reorderMutation.mutateAsync(todos)
    }, 5000, [todos])


    useEffect(() => {
        if (isLoading || isRefetching) return

        setTodos(data!)
    }, [data])

    // useEffect(() => {
    //     localStorage.setItem("lastKnowAmountOfTodos", `${todos.length}`)
    // }, [todos])


    const onDragEnd: DragDropContextProps["onDragEnd"] = async (result, provided) => {
        const fromIndex = result.source.index
        const toIndex = result.destination?.index

        if (toIndex === undefined || (fromIndex === toIndex)) return
        
        const sortedTodos = reorder(todos, fromIndex, toIndex)
        setTodos(sortedTodos)
        trpcCtx.setQueryData(["todo.getAll"], sortedTodos)
        
        
        // const sortedTodosFromDb = await reorderTodos(sortedTodos)
        // setTodos(sortedTodosFromDb)
        // trpcCtx.setQueryData(["todo.getAll"], sortedTodosFromDb)

    }

    return [
        todos,
        {
            isLoading
        },
        {
            refetch,
            onDragEnd,
        },
    ] as const
}

const TodoListSkeleton: React.FC = () => {
    const router = useRouter()

    // const amount = typeof localStorage === "undefined" 
    // ? "6"
    // : parseInt(localStorage.getItem("lastKnowAmountOfTodos") ?? "6")
    const amount = 6

    return (
        <ul /*ref={listRef}*/ className="flex flex-col gap-4">
            {new Array(amount)
            .fill("null")
            .map((_, i) => (
                <li key={i}>
                    <TodoListCardPlaceholder/>
                </li>
            ))}
            <li key={"addBtn"}>
                <button onClick={() => router.push(Routes.NEW_TODO)}
                className="center rounded-md py-2 w-full
                transition-duration
                bg-neutral-700 opacity-20 hover:opacity-100 border border-neutral-600 
                ">
                    <FaPlus className="h-8"/>
                </button>
            </li>
        </ul>
    ) 
}


const TodoList: React.FC<Props> = ({}) => {
    const router = useRouter()
    const [todos, meta, helpers] = useDraggableTodos()

    const [listRef] = useAutoAnimate<HTMLUListElement>({
        duration: 1000,
    })

    console.log(listRef);

    // if (isLoading) return <p>Loading</p>
    // if (data!.length === 0) return <p>You currently have no todos.</p>

    if (meta.isLoading) return <TodoListSkeleton/>

    return (
        <ul ref={listRef} className="flex flex-col">
            {todos.map((todo, i) => (
                <li className="mb-4" key={todo.id}>
                    <TodoListCard todo={todo} />
                </li>
            ))}
            <li key={"addBtn"}>
                <button onClick={() => router.push(Routes.NEW_TODO)}
                className="center rounded-md py-2 w-full
                transition-duration
                bg-neutral-700 opacity-20 hover:opacity-100 border border-neutral-600 
                ">
                    <FaPlus className="h-8"/>
                </button>
            </li>
        </ul>
    )

    return (
        <DragDropContext onDragEnd={helpers.onDragEnd}>
            <Droppable droppableId="todoList">
                {(provided, snapshot) => (
                    <ul /*ref={listRef}*/ className="flex flex-col"
                        {...provided.droppableProps}
                        ref={node => {
                            provided.innerRef(node)
                            // @ts-ignore
                            listRef.current = node /* Ignore the immutable current */
                        }}
                    >
                        {todos.map((todo, i) => (
                            <Draggable draggableId={todo.id} index={i} key={todo.id}>
                                {(provided, snapshot) => (
                                    <li className="mb-4"
                                    ref={provided.innerRef} 
                                    {...provided.dragHandleProps} 
                                    {...provided.draggableProps}
                                    >
                                        <TodoListCard todo={todo} />
                                    </li>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        <li key={"addBtn"}>
                            <button onClick={() => router.push(Routes.NEW_TODO)}
                            className="center rounded-md py-2 w-full
                            transition-duration
                            bg-neutral-700 opacity-20 hover:opacity-100 border border-neutral-600 
                            ">
                                <FaPlus className="h-8"/>
                            </button>
                        </li>
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    )
}


export default TodoList