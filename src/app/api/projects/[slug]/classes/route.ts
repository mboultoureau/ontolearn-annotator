import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { slug } = params;

    // Get exclude query parameter
    const searchParams = request.nextUrl.searchParams;
    const excludeParam = searchParams.get("exclude");
    const excludeList = excludeParam 
      ? excludeParam.split(",").map(item => item.trim())
      : [];

    // Get project by slug
    const project = await db.project.findUnique({
      where: { slug },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch active class types for the project
    const classTypes = await db.classType.findMany({
      where: {
        projectId: project.id,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter out excluded types and return as array of strings
    const filteredClassTypes = classTypes
      .map(ct => ct.name)
      .filter(name => !excludeList.includes(name));

    return NextResponse.json(filteredClassTypes);
  } catch (error) {
    console.error("Error fetching class types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
