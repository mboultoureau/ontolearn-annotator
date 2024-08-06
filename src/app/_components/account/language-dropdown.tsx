import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "../ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { FormControl } from "../ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

type Locale = "FRENCH" | "ENGLISH" | "JAPANESE";

type Language = {
    label: string;
    value: Locale;
};

type Props = {
    value: string;
    languages: readonly Language[];
    onValueChanged: (value: Locale) => void
}

export default function LanguageDropdown({ value, languages, onValueChanged }: Props) {
    const [open, setOpen] = useState(false)
    const t = useTranslations('Account.Settings');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "justify-between",
                            !value && "text-muted-foreground"
                        )}
                    >
                        {value
                            ? languages.find(
                                (language) => language.value === value
                            )?.label
                            : t('selectLanguage')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command>
                    <CommandInput
                        placeholder={t('searchLanguage')}
                        onValueChange={(value) => {
                            if (value === "FRENCH" || value === "ENGLISH" || value === "JAPANESE") {
                                onValueChanged(value)
                            }
                        }} />
                    <CommandList>
                        <CommandEmpty>{t('emptyLanguage')}</CommandEmpty>
                        <CommandGroup>
                            {languages.map((language) => (
                                <CommandItem
                                    value={language.label}
                                    key={language.value}
                                    onSelect={() => {
                                        onValueChanged(language.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            language.value === value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {language.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}