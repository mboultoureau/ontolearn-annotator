import { icons } from "@/lib/icons";
import { Category } from "@prisma/client";
import { LucideProps } from "lucide-react";
import { useTranslations } from "next-intl";
import { ForwardRefExoticComponent, RefAttributes, useEffect, useState } from "react";
import { MultiSelect } from "../ui/multi-select";

export type Props = {
    value: string[],
    onValueChange: (newValue: string[]) => void;
    updateCount?: number;
}

export type CategorySelect = {
    value: string;
    label: string;
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
}

export default function SelectCategories({
    value,
    onValueChange,
    updateCount
}: Props) {
    const t = useTranslations("Category.Select")
    let [categories, setCategories] = useState<CategorySelect[]>([]);

    useEffect(() => {
        fetch('/api/v1/categories')
            .then((res) => res.json())
            .then((data) => {
                const categories = data.map((category: Category) => {
                    const icon = icons.find((icon) => icon.value === category.icon)

                    return {
                        value: category?.id,
                        label: category?.name,
                        icon: icon?.icon
                    };
                });

                setCategories(categories);
            })
            .catch((err) => console.error(err));
    }, [updateCount]);

    return (
        <MultiSelect
            options={categories}
            onValueChange={onValueChange}
            defaultValue={value}
            placeholder={t('placeholder')}
            searchPlaceholder={t('searchPlaceholder')}
            selectAllLabel={t('selectAll')}
            clearLabel={t('clear')}
            closeLabel={t('close')}
            variant="inverted"
            maxCount={3}
        />
    )
}