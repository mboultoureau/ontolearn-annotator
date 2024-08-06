"use client";

import { createDataType } from "@/actions/data-types";
import { dataTypeSchema } from "@/lib/zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormState } from "react-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import SelectIcon from "../category/select-icon";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import DataTypeField from "./data-type-field";

type Props = {
    formId?: string,
    displaySubmit?: boolean,
    data?: z.infer<typeof dataTypeSchema>,
    projectId: string
}

const initialState = {
    success: false,
    message: "",
    errors: []
};

export default function DataTypeForm({ formId = "create-project", displaySubmit = true, data, projectId }: Props) {
    const t = useTranslations("SourceType.Form")
    const [state, formAction] = useFormState(createDataType.bind(null, projectId), initialState);

    const defaultField = {
        name: "",
        label: "",
        type: "STRING",
        required: false,
    }

    const form = useForm<z.infer<typeof dataTypeSchema>>({
        resolver: zodResolver(dataTypeSchema),
        defaultValues: {
            id: data?.id,
            label: data?.label || "",
            name: data?.name || "",
            icon: data?.icon || "",
            fields: data?.fields || [defaultField],
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: "fields",
        control: form.control,
    })

    const onSubmit = async (data: z.infer<typeof dataTypeSchema>) => {
        const response = await formAction(data);
        console.log(response)
    }

    function updateName(e: React.ChangeEvent<HTMLInputElement>, field: any) {
        form.setValue("name", `${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`);
        form.trigger("name");
        field.onChange(e);
    }

    return (
        <Form {...form}>
            {state.message && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorOccurred')}</AlertTitle>
                    <AlertDescription>
                        {state.message}
                    </AlertDescription>
                </Alert>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id={formId}>
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('label')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('labelPlaceholder')} {...field} onChange={(e) => updateName(e, field)} />
                            </FormControl>
                            <FormDescription>{t('labelDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('name')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('namePlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>{t('nameDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('icon')}</FormLabel>
                            <FormControl className="col-span-3">
                                <SelectIcon value={field.value} onValueChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DataTypeField fields={fields} append={append} remove={remove} form={form} />
                {displaySubmit && (
                    <div className="flex justify-end">
                        <Button type="submit">{t('submit')}</Button>
                    </div>
                )}
            </form>
        </Form>
    )
}