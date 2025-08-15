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

const AllServices = [
    "Diseño de portada completa",
    "Rediseño de portada existente",
    "Diseño de contraportada",
    "Diseño de lomo",
    "Diseño completo (portada + contraportada + lomo)",
    "Consultoría de diseño",
    "Otro"
]

const AllNames = [
    "María García", "Carlos López", "Ana Martín", "Diego Rodríguez", "Laura Fernández",
    "Javier Sánchez", "Elena Torres", "Pablo Jiménez", "Carmen Ruiz", "Miguel Ángel",
    "Isabel Moreno", "Andrés Castro", "Beatriz Ortega", "Fernando Delgado", "Cristina Vega"
]

const AllCountries = [
    "España", "México", "Argentina", "Colombia", "Perú", "Chile", "Venezuela", 
    "Ecuador", "Bolivia", "Uruguay", "Paraguay", "Costa Rica", "Panamá", "Guatemala", "Honduras"
]

const AllUsers = [
    "@escritora_novela", "@poeta_urbano", "@cuentista_magico", "@novelista_indie",
    "@autora_fantasia", "@escritor_misterio", "@blogger_literario", "@editora_creativa",
    "@autor_cienciafic", "@narradora_hist", "@escritor_romance", "@autora_thriller",
    "@poeta_moderno", "@novelista_joven", "@cuentista_real"
]

const AllEmails = [
    "maria.escritora@gmail.com", "carlos.novelas@hotmail.com", "ana.libros@yahoo.com",
    "diego.autor@outlook.com", "laura.cuentos@gmail.com", "javier.poemas@hotmail.com",
    "elena.narrativa@yahoo.com", "pablo.ficcion@gmail.com", "carmen.relatos@outlook.com",
    "miguel.historias@hotmail.com", "isabel.novela@gmail.com", "andres.escritor@yahoo.com",
    "beatriz.autora@outlook.com", "fernando.libros@gmail.com", "cristina.textos@hotmail.com"
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
    for (let i = 0; i < 15; i++) {
        const form: Prisma.FormCreateInput = {
            name: AllNames[Math.floor(Math.random() * AllNames.length)],
            country: AllCountries[Math.floor(Math.random() * AllCountries.length)],
            user: AllUsers[Math.floor(Math.random() * AllUsers.length)],
            email: AllEmails[Math.floor(Math.random() * AllEmails.length)],
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vulputate auctor est, sed fringilla est convallis sed. Curabitur iaculis urna diam, quis sollicitudin nisl pellentesque vel. Vivamus elementum, lacus sed ullamcorper bibendum, tellus felis suscipit nisi, sed eleifend ante dolor ac purus. Sed sit amet felis tortor. Donec dignissim urna eget semper fringilla. Suspendisse arcu libero, cursus quis imperdiet hendrerit, tempus id turpis. Nulla imperdiet dui lacus, ut iaculis ante commodo molestie. Aenean non tellus sed urna maximus dictum ac a nunc. Proin tristique porta dui, nec scelerisque urna. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec a leo lorem. Nunc molestie malesuada ligula at gravida. In ac turpis elementum nisl venenatis imperdiet.\n" +
                "\n" +
                "Phasellus mi mauris, aliquet at odio semper, aliquet dictum justo. Duis quis pharetra nisi. Duis vel interdum nulla, ut vestibulum augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Morbi a augue pharetra, consectetur urna condimentum, ornare nisi. Praesent sit amet lacus pretium, dignissim ante ut, feugiat augue. Etiam purus ante, congue vel lectus vehicula, semper pulvinar urna. Morbi dui leo, vehicula id venenatis non, dapibus a diam. In mauris arcu, maximus eu mollis id, congue convallis leo. Vivamus ullamcorper sit amet justo et euismod. Integer mattis lacus sed nisl fringilla ornare. Nunc et accumsan purus. Quisque molestie tellus eu diam sollicitudin malesuada. Morbi eget libero sem.",
            services: AllServices[Math.floor(Math.random() * AllServices.length)]
        }
        await prisma.form.create({
            data: form
        })
    }
}

main();