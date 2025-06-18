import prisma from "../src/lib/prisma.ts";
import {Prisma} from "@prisma/client";
import bcrypt from 'bcrypt';

const userData: Prisma.UserCreateInput[] = [
    {
        name: "admin",
        password: "changeme",
        email: "lequodo@gmail.com"
    }
];

const formData: Prisma.FormCreateInput[] = [
    {
        name: "Gabi",
        country: "Españita",
        user: "@madameArdienteyHot",
        email: "madameArdiente@gmail.com",
        services: "A,B,C,D",
        message: "Holi jijiijijij"
    }
]

export async function main() {
    await prisma.user.deleteMany();
    await prisma.form.deleteMany();

    for (const u of userData) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await prisma.user.create({
            data: {
                ...u,
                password: hashedPassword
            }
        });
        console.log(`Created user:  ${u.name}`)
    }

    for (const form of formData) {
        await prisma.form.create({
            data: form
        })
    }
}

main();