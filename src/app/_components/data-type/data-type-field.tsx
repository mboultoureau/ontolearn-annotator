import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type Props = {
    fields: any,
    append: any,
    remove: any,
    updateName: any,
}

export default function DataTypeField({ fields, append, remove, form }: Props) {
    const t = useTranslations("SourceType.Form")

    const updateName = (e: React.ChangeEvent<HTMLInputElement>, field: any, index) => {
        form.setValue(`fields.${index}.name`, `${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`);
        form.trigger(`fields.${index}.name`);
        field.onChange(e);
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold mb-2">Fields</h2>
                <Button
                    onClick={() => append({ name: "", label: "", type: "STRING", required: false })}
                    variant="default"
                    size="sm"
                >
                    {t('addField')}
                </Button>
            </div>
            {fields.map((field, index) => (
                <Card className="mt-4" key={field.id}>
                    <CardHeader className="flex flex-row justify-between items-center">
                        {t('fieldNumber', {number: index + 1})}
                        <Button variant="outline" size="icon" disabled={fields.length <= 1} onClick={() => remove(index)}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <FormField
                            control={form.control}
                            name={`fields.${index}.label`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('fieldLabel')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} onChange={(e) => updateName(e, field, index)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`fields.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('fieldName')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            key={field.id}
                            name={`fields.${index}.type`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('fieldType')}
                                    </FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('fieldTypeSelectPlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FILE">{t('fieldTypeFile')}</SelectItem>
                                                <SelectItem value="STRING">{t('fieldTypeString')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}