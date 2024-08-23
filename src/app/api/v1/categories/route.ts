import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

export async function GET() {
    const categories = await prisma.category.findMany();

    return NextResponse.json(categories);
}