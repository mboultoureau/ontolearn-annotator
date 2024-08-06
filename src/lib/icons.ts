import { Briefcase, CircleHelp, Code, Croissant, Dumbbell, File, FileArchive, Gavel, GraduationCap, HeartPulse, Leaf, Microscope, Palette, Text, Users } from "lucide-react";

export type Icon = {
    name: string;
    value: string;
    icon: any;
}

export const icons: Icon[] = [
    {
        name: "health",
        value: "heart-pulse",
        icon: HeartPulse
    },
    {
        name: "environment",
        value: "leaf",
        icon: Leaf
    },
    {
        name: "education",
        value: "graduation-cap",
        icon: GraduationCap
    },
    {
        name: "technology",
        value: "code",
        icon: Code
    },
    {
        name: "arts",
        value: "palette",
        icon: Palette
    },
    {
        name: "sports",
        value: "dumbbell",
        icon: Dumbbell
    },
    {
        name: "social",
        value: "users",
        icon: Users
    },
    {
        name: "politics",
        value: "gavel",
        icon: Gavel
    },
    {
        name: "science",
        value: "microscope",
        icon: Microscope
    },
    {
        name: "business",
        value: "briefcase",
        icon: Briefcase
    },
    {
        name: "other",
        value: "circle-help",
        icon: CircleHelp
    },
    {
        name: "croissant",
        value: "croissant",
        icon: Croissant
    },
    {
        name: "file",
        value: "file",
        icon: File
    },
    {
        name: "fileArchive",
        value: "file-archive",
        icon: FileArchive
    },
    {
        name: "text",
        value: "text",
        icon: Text
    }
]