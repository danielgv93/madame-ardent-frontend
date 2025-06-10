import prisma from "../src/lib/prisma.ts";
import { Prisma } from "@prisma/client";

const userData: Prisma.UserCreateInput[] = [
    {
        name: "Alice",
    },
    {
        name: "Bob",
    },
];

export async function main() {
    await prisma.user.deleteMany();

    for (const u of userData) {
        await prisma.user.create({ data: u });
    }
}

main();