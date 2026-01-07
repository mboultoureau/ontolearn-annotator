import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseWorkflowDefinitionSafe } from "@/lib/workflow-engine/parser";
import { compileWorkflowToMachine } from "@/lib/workflow-engine/compiler";

// POST: Validate workflow YAML against schema and compiler
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; type: string } }
) {
  try {
    const { slug, type } = params;
    const body = await request.json();
    const { workflow } = body;

    if (!workflow || typeof workflow !== "string") {
      return NextResponse.json({ valid: false, errors: [{ path: "root", message: "Invalid workflow YAML", code: "invalid_input" }] }, { status: 400 });
    }

    // Ensure project exists
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ valid: false, errors: [{ path: "project", message: "Project not found", code: "not_found" }] }, { status: 404 });
    }

    // Validate YAML against schema
    const parsed = parseWorkflowDefinitionSafe(workflow);
    if (!parsed.success) {
      return NextResponse.json({ valid: false, errors: parsed.errors }, { status: 400 });
    }

    // Compile to ensure the definition is executable
    try {
      const compiled = compileWorkflowToMachine(parsed.data);
      return NextResponse.json({
        valid: true,
        metadata: {
          workflowId: compiled.metadata.workflowId,
          version: compiled.metadata.version,
          stateCount: compiled.metadata.stateCount,
          transitionCount: compiled.metadata.transitionCount,
        },
      });
    } catch (compileError) {
      const message = compileError instanceof Error ? compileError.message : "Compilation failed";
      return NextResponse.json({
        valid: false,
        errors: [
          {
            path: "compiler",
            message,
            code: "compile_error",
          },
        ],
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to validate configuration:", error);
    return NextResponse.json({ valid: false, errors: [{ path: "root", message: "Internal server error", code: "server_error" }] }, { status: 500 });
  }
}
