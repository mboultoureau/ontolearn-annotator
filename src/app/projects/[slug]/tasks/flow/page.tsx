import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Categories from "./categories";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Task.Flow');

    return {
        title: t('title'),
    }
}

const settings = {
    enableDoesNotContain: true,
    enableIDontKnow: true,
}

const categories = [
    {
        value: "single",
        label: "Single",
        children: [
            {
                label: "Microparticule",
                value: "microparticule",
                image: "/annotations/microparticule.png"
            },
            {
                label: "Simple plate",
                value: "simple_plate",
                image: "/annotations/simple_plate.png"
            },
            {
                label: "Fan-like plate",
                value: "fan_like_plate",
                image: "/annotations/fan_like_plate.png"
            },
            {
                label: "Dentrite plate",
                value: "dentrite_plate",
                image: "/annotations/dentrite_plate.png"
            },
            {
                label: "Fern-like dentrite plate",
                value: "fern_like_dentrite_plate",
                image: "/annotations/fern_like_dentrite_plate.png"
            },
            {
                label: "Column/Square",
                value: "column_square",
                image: "/annotations/column_square.png"
            },
            {
                label: "Singular Irregular",
                value: "singular_irregular",
                image: "/annotations/singular_irregular.png"
            },
            {
                label: "Cloud-particle",
                value: "cloud_particle",
                image: "/annotations/cloud_particle.png"
            }
        ]
    },
    {
        value: "multiple",
        label: "Multiple",
        children: [
            {
                label: "Combinations",
                value: "combinations",
                image: "/annotations/combinations.png"
            },
            {
                label: "Double plate",
                value: "double_plate",
                image: "/annotations/double_plate.png"
            },
            {
                label: "Multiple Columns/Squares",
                value: "multiple_columns_squares",
                image: "/annotations/multiple_columns_squares.png"
            },
            {
                label: "Multiple Irregulars",
                value: "multiple_irregulars",
                image: "/annotations/multiple_irregulars.png"
            }
        ]
    }
]

export default function TaskPage() {
    return (
        <div className="hidden h-full flex-col md:flex">
            <div className="container h-full py-6">
                <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_300px]">
                    <div className="hidden flex-col space-y-4 sm:flex md:order-2">
                        <Categories categories={categories} settings={settings} />
                    </div>
                    <div className="md:order-1">
                        <div className="flex h-full flex-col space-y-4">
                            <div className="block flex-1 p-4 relative">
                                <Image
                                    alt="Input"
                                    src="/datasets/water_crystal_1.JPG"
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}