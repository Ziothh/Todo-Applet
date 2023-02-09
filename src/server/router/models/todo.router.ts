import { Todo } from "@prisma/client";
import { z } from "zod";
import { TODO_VALIDATORS } from "../../../shared/validators/todo.validators";
import { prisma } from "../../db/client";
import { createRouter } from "../context";

const todoRouter = createRouter()
.middleware(async ({next}) => {
    await new Promise(res => {
        setTimeout(res, 1000)
    })

    return next()
})
.query("getAll", {
    resolve({ctx, input}) {
        // ctx.session?.user?.id
        return prisma.todo.findMany({
            orderBy: {order: "asc"},
        })
    }
})
.query("getOne", {
    input: z.object({
        id: z.string(),
    }),
    async resolve({ctx, input}) {
        return prisma.todo.findFirstOrThrow({
            where: {
                id: input.id
            }
        })
    }
})
.mutation("toggleCompleted", {
    input: z.object({
        id: z.string(),
        isCompleted: z.boolean().optional(),
    }),
    resolve({ctx, input}) {
        return prisma.todo.update({
            where: {
                id: input.id
            },
            data: {
                isCompleted: input.isCompleted
            }
        })
    }
})
.mutation("create", {
    input: TODO_VALIDATORS.todo.create,
    async resolve({ctx, input}) {
        const highestOrder = await (await prisma.todo.findFirst({
            orderBy: {
                order: "desc"
            }
        }) ?? {order: 0}).order

        return prisma.todo.create({
            data: {
                ...input,
                order: highestOrder + 1,

            },
        })
    }
})
.mutation("update", {
    input: TODO_VALIDATORS.todo.update,
    resolve({ctx, input}) {
        return prisma.todo.update({
            where: {
                id: input.id,
            },
            data: {
                ...input
            }
        })
    }
})
.mutation("reorder", {
    input: z.array(z.object({
        id: z.string(),
    })),
    async resolve({ctx, input}) {
        const updatedTodos: Todo[] = [];

        for (let index = 0; index < input.length; index++) {
            const todo = input[index]!

            updatedTodos.push(await prisma.todo.update({
                data: {
                    order: index,
                },
                where: {id: todo.id},
            }))
        }

        return updatedTodos
    }
})
.mutation("delete", {
    input: z.object({
        id: z.string(),
    }),
    resolve({ctx, input}) {
        return prisma.todo.delete({
            where: {
                id: input.id
            }
        })
    }
})

export default todoRouter