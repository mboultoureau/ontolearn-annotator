import { PrismaClient } from '@prisma/client';
import { categories } from "./fixtures/categories";
import { projectMembers, projects } from "./fixtures/projects";
import { users } from './fixtures/users';

const prisma = new PrismaClient()

const seed = async () => {
    await prisma.user.upsert({
        where: {
            email: users[0].email
        },
        create: users[0],
        update: users[0]
    });

    await prisma.category.upsert({
        where: {
            slug: categories[0].slug
        },
        create: categories[0],
        update: categories[0]
    });

    await prisma.project.upsert({
        where: {
            slug: projects[0].slug
        },
        create: projects[0],
        update: projects[0]
    });

    await prisma.projectMember.create({
        data: {
            role: "ADMIN",
            user: {
                connect: {
                    email: projectMembers[0].user.email
                }
            },
            project: {
                connect: {
                    slug: projectMembers[0].project?.slug
                }
            }
        }
    });
}

seed()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })