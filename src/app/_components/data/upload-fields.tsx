import { createDataInputSchema } from "@/lib/validation-schemas/data";
import { SourceTypeField } from "@prisma/client";
import { FieldArrayWithId, useForm } from "react-hook-form";
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";

export type Props = {
    formFields: FieldArrayWithId<{
        dataTypeId: string;
        fields: {
            id: string;
            value: string | FileList;
        }[];
    }, "fields", "id">[],
    fields: SourceTypeField[],
    form: ReturnType<typeof useForm<z.infer<typeof createDataInputSchema>>>
}

export default function UploadFields({ formFields, fields, form }: Props) {
    return (
        <>
            {formFields.map((formField, index) => {
                return (
                    <FormField
                        control={form.control}
                        name={`fields.${index}.value`}
                        key={formField.id}
                        render={({ field: formFieldRender }) => (
                            <FormItem>
                                <FormLabel>{fields.find((field) => field.id === formField.id)?.label}</FormLabel>
                                <FormControl>
                                    <Input
                                        type={fields.find((field) => field.id === formField.id)?.type === "STRING" ? "text" : "file"}
                                        {...form.register(`fields.${index}.value`)}
                                        // {...formFieldRender}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                )
            })}
        </>
    )
}