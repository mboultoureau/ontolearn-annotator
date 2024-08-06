
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/app/_components/ui/select";
import { icons } from "@/utils/icons";
import { useTranslations } from "next-intl";

export type Props = {
    className?: string;
    value: string;
    onValueChange: (newValue: string) => void;
}

export default function SelectIcon({
    className,
    value,
    onValueChange
}: Props) {
    const tIcons = useTranslations("Icons.Icons");
    const t = useTranslations("Icons.Select");

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{t('title')}</SelectLabel>
                    {icons.map(icon => (
                        <SelectItem value={icon.value} className="hover:bg-gray-200" key={icon.value}>
                            <icon.icon className="mr-2 inline-block" />
                            {tIcons(icon.name)}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
