import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/server/auth";
import { PermissionDeniedError, requireRead, requireWrite } from "@/lib/abac-guards";

/**
 * Both handlers used to accept anonymous requests: the POST rewrites a project's entire
 * annotation workflow, so a session alone would not be enough either — reading settings
 * is USER-visible, writing them is ADMIN-only per the policy.
 *
 * Returns a response when the caller must be refused, null when it may proceed.
 */
async function denyUnlessPermitted(check: () => Promise<void>) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await check();
    return null;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw error;
  }
}

// GET: Fetch configuration by project slug and type
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; type: string } }
) {
  try {
    const { slug, type } = params;

    // Find project by slug
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const denied = await denyUnlessPermitted(() => requireRead(project.id, "settings"));
    if (denied) return denied;

    // Find configuration
    const config = await prisma.configuration.findUnique({
      where: {
        projectId_type: {
          projectId: project.id,
          type,
        },
      },
    });

    if (!config) {
      return NextResponse.json({ workflow: null });
    }

    return NextResponse.json({
      workflow: (config.settings as { workflow?: string })?.workflow || null,
    });
  } catch (error) {
    console.error("Failed to fetch configuration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Save configuration by project slug and type
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; type: string } }
) {
  try {
    const { slug, type } = params;
    const body = await request.json();
    const { workflow } = body;

    if (!workflow || typeof workflow !== "string") {
      return NextResponse.json({ error: "Invalid workflow YAML" }, { status: 400 });
    }

    // Find project by slug
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const denied = await denyUnlessPermitted(() => requireWrite(project.id, "settings"));
    if (denied) return denied;

    // Upsert configuration
    await prisma.configuration.upsert({
      where: {
        projectId_type: {
          projectId: project.id,
          type,
        },
      },
      create: {
        projectId: project.id,
        type,
        settings: { workflow },
      },
      update: {
        settings: { workflow },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save configuration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
