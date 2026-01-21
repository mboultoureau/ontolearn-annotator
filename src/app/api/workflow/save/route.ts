import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Annotation as PrismaAnnotation } from '@prisma/client';

interface WorkflowAnnotation {
    id: string;
    stateId: string;
    type: 'area' | 'choice' | 'multi_choice' | 'yes_no';
    timestamp: string;
    payload: any;
    parentState?: string;
    iteration?: number;
}

interface SaveWorkflowRequest {
    projectId: string;
    dataFileId: string;
    userId: string;
    workflowContext: any;
    annotations: WorkflowAnnotation[];
    completedAt: string;
}

/**
 * POST /api/workflow/save
 * Saves workflow annotations to database
 * 
 * Creates AreaOfInterest for each area annotation and AnnotationType for each choice annotation
 */
export async function POST(request: NextRequest) {
    /**
     * Extracts class values from the annotation payload
     * Handles different payload structures for choice and multi_choice
     */
    function extractClassesFromPayload(payload: any): string[] {
        // For multi_choice (subsections), classes are in an ordered array
        if (Array.isArray(payload?.subsection?.classes)) {
            return payload.subsection.classes;
        }

        // For single crystal class selection
        if (payload?.crystal?.class && typeof payload.crystal.class === 'string') {
            return [payload.crystal.class];
        }

        // Fallback: check for direct class value
        if (payload?.class && typeof payload.class === 'string') {
            return [payload.class];
        }

        return [];
    }
    try {
        const body: SaveWorkflowRequest = await request.json();

        const { projectId, dataFileId, userId, workflowContext, annotations, completedAt } = body;

        // Validate required fields
        if (!projectId || !dataFileId || !annotations || !Array.isArray(annotations)) {
            return NextResponse.json(
                { error: 'Missing required fields: projectId, dataFileId, annotations' },
                { status: 400 }
            );
        }

        // Verify the dataFile exists
        const dataFile = await prisma.dataFile.findUnique({
            where: { id: dataFileId },
        });

        if (!dataFile) {
            return NextResponse.json(
                { error: `DataFile with id ${dataFileId} not found` },
                { status: 404 }
            );
        }

        // Group annotations by logical item (crystal or subsection)
        const annotationGroups = groupAnnotationsByContext(annotations);
        const createdAnnotations = [];
        let lastRootAnnotationId: string | null = null;

        for (const group of annotationGroups) {
            // Create AreaOfInterest from the first area annotation in the group
            // Each group must start with an area annotation
            const areaAnnotation = group.annotations.find(a => a.type === 'area');
            if (!areaAnnotation) {
                console.warn('[POST /api/workflow/save] Skipping group without area annotation:', group);
                continue;
            }

            const areaOfInterest = await prisma.areaOfInterest.create({
                data: {
                    area: areaAnnotation.payload.coordinates,
                },
            });

            // Collect class values and quality separately from this group
            const allClassValues: Array<{ className: string; rank: number }> = [];
            let rankCounter = 1;
            let qualityValue: string | null = null;

            for (const ann of group.annotations) {
                if (ann.type === 'choice' || ann.type === 'multi_choice') {
                    const q = extractQualityFromPayload(ann.payload);
                    if (q) {
                        qualityValue = q;
                    }

                    const classValues = extractClassesFromPayload(ann.payload);
                    for (const className of classValues) {
                        allClassValues.push({ className, rank: rankCounter++ });
                    }
                }
            }

            // Create Annotation record linked to the area
            // Parent links subsections to the last root annotation
            const annotationRecord: PrismaAnnotation = await prisma.annotation.create({
                data: {
                    dataFileId,
                    areaOfInterestId: areaOfInterest.id,
                    author: 'USER',
                    userId: userId || undefined,
                    quality: qualityValue,
                    parentAnnotationId: group.parentState ? lastRootAnnotationId || undefined : undefined,
                    createdAt: new Date(areaAnnotation.timestamp),
                },
            });

            // Remember latest root for nested groups
            if (!group.parentState) {
                lastRootAnnotationId = annotationRecord.id;
            }

            // Create AnnotationType records for all collected classes
            const annotationTypes = [];
            for (const { className, rank } of allClassValues) {
                // Find the existing ClassType - DO NOT create if missing
                const classType = await prisma.classType.findFirst({
                    where: {
                        projectId,
                        name: className,
                    },
                });

                if (!classType) {
                    // Log warning but don't fail - just skip this class
                    console.warn(`[POST /api/workflow/save] ClassType "${className}" not found for project ${projectId}. Skipping.`);
                    continue;
                }

                // Create AnnotationType with rank
                const annotationType = await prisma.annotationType.create({
                    data: {
                        annotationId: annotationRecord.id,
                        classTypeId: classType.id,
                        rank,
                    },
                });

                annotationTypes.push(annotationType);
            }

            createdAnnotations.push({
                id: annotationRecord.id,
                areaOfInterestId: areaOfInterest.id,
                classCount: allClassValues.length,
                annotationTypes,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Workflow annotations saved successfully',
            dataFileId,
            annotationsCreated: createdAnnotations.length,
            completedAt,
            details: createdAnnotations,
        });
    } catch (error) {
        console.error('[POST /api/workflow/save] Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to save workflow annotations',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

/**
 * Groups annotations by context (crystal/subsection)
 * Each group should have one area annotation followed by its associated choices
 * Groups are separated when:
 * - A new area annotation is encountered
 * - The parentState changes (entering/exiting loops)
 */
type AnnotationGroup = { parentState?: string; annotations: WorkflowAnnotation[] };

function groupAnnotationsByContext(annotations: WorkflowAnnotation[]): AnnotationGroup[] {
    const groups: AnnotationGroup[] = [];
    let currentGroup: AnnotationGroup | null = null;

    for (const annotation of annotations) {
        // Skip yes_no annotations (they're just navigation)
        if (annotation.type === 'yes_no') {
            continue;
        }

        // Start a new group when we encounter an area annotation
        if (annotation.type === 'area') {
            // Save previous group if it has content
            if (currentGroup && currentGroup.annotations.length > 0) {
                groups.push(currentGroup);
            }
            // Start new group with this area
            currentGroup = { parentState: annotation.parentState, annotations: [annotation] };
        } else if (annotation.type === 'choice' || annotation.type === 'multi_choice') {
            // Add choice/multi_choice to the current group (if exists)
            if (currentGroup) {
                currentGroup.annotations.push(annotation);
            }
        }
    }

    // Don't forget the last group
    if (currentGroup && currentGroup.annotations.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
}

function extractQualityFromPayload(payload: any): string | null {
    // Quality is stored at payload.crystal.quality
    if (payload?.crystal?.quality && typeof payload.crystal.quality === 'string') {
        return payload.crystal.quality;
    }
    return null;
}
