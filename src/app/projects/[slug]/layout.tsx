
import HeaderMenu from "@/app/_components/header/header-menu";
import { fetchProject } from "@/services/projects";
import { notFound } from "next/navigation";

export default async function Layout({
    children,
    params
}: {
    children: React.ReactNode,
    params: {
        slug: string
    }
}) {
    const project = await fetchProject({
        slug: params.slug,
    });
    if (!project) {
        notFound();
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <HeaderMenu project={project} />
            <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
                {children}
            </main>
        </div>
    )
}
