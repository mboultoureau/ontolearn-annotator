import { icons } from "@/lib/icons";
import { SourceType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";

export type Props = {
    dataTypes: SourceType[];
    value: string;
    onValueChange: (newValue: string) => void;
}

export default function SelectDataType({ dataTypes, value, onValueChange }: Props) {
    const t = useTranslations("SourceType.Select");

    const data = dataTypes.map((dataType) => {
        const icon = icons.find((icon) => icon.value === dataType.icon)
        return {
            ...dataType,
            icon: icon?.icon
        }
    })

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger>
                <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{t('source')}</SelectLabel>
                    {data.map(dataType => (
                        <SelectItem value={dataType.id} className="hover:bg-gray-200" key={dataType.id}>
                            <dataType.icon className="mr-2 inline-block" />
                            {dataType.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}