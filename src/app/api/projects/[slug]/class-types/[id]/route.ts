import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { PermissionDeniedError, requireWrite } from "@/lib/abac-guards";
import { z } from "zod";

/**
 * Editing the project's class vocabulary is an ADMIN act: the policy grants
 * settings:write to ADMIN only, so a plain USER is refused. Returns a 403 response
 * when denied, null when allowed.
 */
async function denyIfNotAdmin(projectId: string) {
  try {
    await requireWrite(projectId, "settings");
    return null;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw error;
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

/**
 * PATCH /api/projects/[slug]/class-types/[id]
 * Update a class type
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = params;
    const body = await request.json();

    // Validate input
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Get project
    const project = await db.project.findUnique({
      where: { slug },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const denied = await denyIfNotAdmin(project.id);
    if (denied) return denied;

    // Check class type exists and belongs to project
    const classType = await db.classType.findFirst({
      where: {
        id,
        projectId: project.id,
      },
    });

    if (!classType) {
      return NextResponse.json(
        { error: "Class type not found" },
        { status: 404 }
      );
    }

    // If updating name, check it doesn't conflict
    if (validation.data.name && validation.data.name !== classType.name) {
      const existing = await db.classType.findFirst({
        where: {
          projectId: project.id,
          name: validation.data.name,
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Class type with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update class type
    const updated = await db.classType.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/projects/[slug]/class-types/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[slug]/class-types/[id]
 * Soft delete a class type (set status to INACTIVE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = params;

    // Get project
    const project = await db.project.findUnique({
      where: { slug },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const denied = await denyIfNotAdmin(project.id);
    if (denied) return denied;

    // Check class type exists and belongs to project
    const classType = await db.classType.findFirst({
      where: {
        id,
        projectId: project.id,
      },
      include: {
        _count: {
          select: { annotationTypes: true },
        },
      },
    });

    if (!classType) {
      return NextResponse.json(
        { error: "Class type not found" },
        { status: 404 }
      );
    }

    // Check if class type is in use
    if (classType._count.annotationTypes > 0) {
      // Soft delete - set status to INACTIVE
      const updated = await db.classType.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      return NextResponse.json({
        message: "Class type marked as inactive (has existing annotations)",
        classType: updated,
      });
    }

    // Hard delete if not in use
    await db.classType.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Class type deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/projects/[slug]/class-types/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
