"use client";

import { createData } from "@/actions/data";
import { createDataInputSchema } from "@/lib/validation-schemas/data";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma, Project } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useServerAction } from 'zsa-react';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { SubmitButton } from "../ui/submit-button";
import { useToast } from "../ui/use-toast";
import SelectDataType from "./select-data-type";
import UploadFields from "./upload-fields";

export type SourceTypeWithFields = Prisma.SourceTypeGetPayload<{
    include: {
        fields: true
    }
}>

export type Props = {
    project: Project;
    sourceTypes: SourceTypeWithFields[];
}

export default function UploadForm({ project, sourceTypes }: Props) {
    const { toast } = useToast();
    const t = useTranslations('Data.Form');

    const form = useForm<z.infer<typeof createDataInputSchema>>({
        resolver: zodResolver(createDataInputSchema),
        defaultValues: {
            sourceTypeId: '',
            fields: []
        }
    })

    const { fields: formFields, remove, append } = useFieldArray({
        keyName: "key",
        control: form.control,
        name: 'fields'
    })

    const fields = sourceTypes.find((sourceType) => sourceType.id === form.getValues().sourceTypeId)?.fields || [];

    const { execute, isPending, isError, error } = useServerAction(createData, {
        onError: ({ err }) => {
            if (!err.fieldErrors) return;

            const keys = Object.keys(err.fieldErrors) as Array<keyof typeof err.fieldErrors>;
            keys.forEach((key) => {
                const errorMessage = err.fieldErrors[key]?.join(' ');

                form.setError(key, {
                    type: 'custom',
                    message: errorMessage
                })
            })
        },
        onSuccess: () => {
            toast({
                title: t('dataUploaded')
            })
            redirect(`/projects/${project.slug}/data`)
        }
    });

    return (
        <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit((values) => {
                const formData = new FormData();
                formData.append('sourceTypeId', values.sourceTypeId);
                values.fields.forEach((field) => {
                    if (field.value instanceof FileList) {
                        formData.append(`fields[${field.id}]`, field.value[0]);
                        return;
                    }
                    formData.append(`fields[${field.id}]`, field.value);
                });
                
                execute(formData);
            })}>
                {isError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('errorOccurred')}</AlertTitle>
                        <AlertDescription>
                            {error.message}
                        </AlertDescription>
                    </Alert>
                )}
                <FormField
                    control={form.control}
                    name="sourceTypeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sourceType')}</FormLabel>
                            <FormControl>
                                <SelectDataType dataTypes={sourceTypes} value={field.value} onValueChange={(value) => {
                                    const fields = sourceTypes.find((sourceType) => sourceType.id === value)?.fields || [];
                                    remove()
                                    fields.forEach((field) => {
                                        append({ id: field.id, value: '' })
                                    });
                                    field.onChange(value);
                                }} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <UploadFields form={form} formFields={formFields} fields={fields} />
                <div className="flex justify-end">
                    <SubmitButton text={t('submit')} />
                </div>
            </form>
        </Form>
    )
}