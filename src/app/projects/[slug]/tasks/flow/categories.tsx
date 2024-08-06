"use client";

import { useToast } from "@/app/_components/ui/use-toast";
import { CircleHelp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Category from "./category";

type Category = {
    label: string;
    value: string;
    image?: string;
    children?: Category[];
}

type Settings = {
    enableDoesNotContain?: boolean;
    enableIDontKnow?: boolean;
}

type Props = {
    categories: Category[];
    settings: Settings;
}

export default function Categories({ categories, settings }: Props) {
    const t = useTranslations('Task.Flow');

    const [availableCategories, setAvailableCategories] = useState<Category[]>(categories);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const { toast } = useToast()
    const router = useRouter()

    const handleCategoryClick = (category: Category) => {
        setSelectedCategory(category);
        if (category.children) {
            setAvailableCategories(category.children || []);
        } else {
            toast({
                title: t('completedTitle'),
                description: t('completedDescription')
            })
            router.push("/projects/fashion-msint")
        }
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {availableCategories.map((category) => (
                <Category
                    key={category.value}
                    text={category.label}
                    image={category.image}
                    onClick={() => handleCategoryClick(category)}
                />
            ))}
            {settings.enableDoesNotContain && (
                <Category text={t('doesNotContain')} slotImage={
                    <div className="bg-muted flex justify-center items-center aspect-square rounded-md" style={{width: "40px", height: "40px"}}>
                        <X />
                    </div>
                } />
            )}
            {settings.enableIDontKnow && (
                <Category text={t('iDoNotKnow')} slotImage={
                    <div className="bg-muted flex justify-center items-center aspect-square rounded-md" style={{width: "40px", height: "40px"}}>
                        <CircleHelp />
                    </div>
                } />
            )}
        </div>
    )
}