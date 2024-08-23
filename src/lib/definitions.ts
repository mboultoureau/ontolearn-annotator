import { $Enums } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

export type Project = {
    id: string;
    name: string;
    slug: string;
    description: string;
    visibility: "PUBLIC" | "PRIVATE";
    createdAt: string;
    updatedAt: string;
}

export enum DataType {
    IMAGE = "IMAGE",
    LARGE_IMAGE = "LARGE_IMAGE",
}

export enum DataStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export type StatusInfo = {
    time?: number;
    time_left?: number;
    progress?: number;
}

export type Data = {
    id: string;
    name: string;
    type: $Enums.DataType;
    status: $Enums.SourceStatus;
    uploadedAt: Date;
    filePath: string;
    statusInfo: StatusInfo|JsonValue;
};

export type ErrorResponse = {
    message: string;
    errors?: {
        [key: string]: string[];
    };
}

export type ProjectMember = {
    id?: string;
    role: string;
    user: {
        id?: string;
        name?: string;
        email: string;
    },
    project?: {
        id?: string;
        name?: string;
        slug: string;
    }
}