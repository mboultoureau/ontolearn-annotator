import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
import { User } from "@prisma/client";

export const fetchUserWithEmail = async (email: string): Promise<any> => {
    return prisma.user.findUnique({
        where: {
            email
        }
    });
}

export const getUser = async(): Promise<User> => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to get your user information");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: session.user.id
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
}