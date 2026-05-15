import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "admin";

if (!email || !password) {
    console.error("[seed-prod] ADMIN_EMAIL and ADMIN_PASSWORD must be set");
    process.exit(1);
}

const prisma = new PrismaClient();

try {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
        where: { email },
        update: { password: hashed, name },
        create: { email, name, password: hashed },
    });
    console.log(`[seed-prod] Admin user ensured: ${email}`);
} finally {
    await prisma.$disconnect();
}
