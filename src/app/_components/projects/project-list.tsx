import { icons } from "@/lib/icons";
import { Prisma } from "@prisma/client";
import { ProjectItem } from "../project-item";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const categoriesWithProjects = Prisma.validator<Prisma.CategoryDefaultArgs>()({
    include: { projects: true },
})

type CategoriesWithProjects = Prisma.CategoryGetPayload<typeof categoriesWithProjects>[]

export type Props = {
    categories: CategoriesWithProjects
}

export default function ProjectList({ categories }: Props) {
    const data = categories.map((category) => {
        const icon = icons.find((icon) => icon.value === category.icon)
        return {
            ...category,
            icon: icon?.icon
        }
    })

    return <>
        {data.map((category) => (
            <>
                <div className="mt-6 space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        <category.icon className="mr-2 inline-block" /> {category.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {category.description}
                    </p>
                </div >
                <Separator className="my-4" />
                <div className="relative">
                    <ScrollArea>
                        <div className="flex space-x-4 pb-4">
                            {category.projects.map((project: any) => (
                                <ProjectItem
                                    key={project.id}
                                    project={project}
                                    className="w-[150px]"
                                    aspectRatio="square"
                                    width={150}
                                    height={150}
                                />
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </>
        ))}
    </>
}