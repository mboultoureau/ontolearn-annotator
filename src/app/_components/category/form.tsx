import { createCategory } from "@/actions/categories";
import { categorySchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import SelectIcon from "./select-icon";

const initialState = {
    success: false,
    message: ""
}

export type Props = {
    id?: string;
    onSubmitSuccess: () => void
}

export default function CategoryForm({
    id,
    onSubmitSuccess
}: Props) {
    const t = useTranslations("Category.Form")
    const [state, formAction] = useFormState(createCategory, initialState);

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            icon: "circle-help",
        },
    });

    // Close dialog when successful
    useEffect(() => {
        if (state.success) {
            onSubmitSuccess();
        }
    }, [state.success]);

    const onSubmit = async (data: z.infer<typeof categorySchema>) => {
        const response = await formAction(data);
    }

    function updateSlug(e: React.ChangeEvent<HTMLInputElement>, field: any) {
        form.setValue("slug", `${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`);
        form.trigger("slug");
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id={id}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem >
                            <div className="grid grid-cols-4 items-center gap-4">
                                <FormLabel>{t('name')}</FormLabel>
                                <FormControl className="col-span-3">
                                    <Input placeholder={t('namePlaceholder')} {...field} onChange={(e) => updateSlug(e, field)} />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <FormLabel>{t('slug')}</FormLabel>
                                <FormControl className="col-span-3">
                                    <Input placeholder={t('slugPlaceholder')} {...field} />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('description')}</FormLabel>
                            <FormControl>
                                <Textarea placeholder={t('descriptionPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <FormLabel>{t('icon')}</FormLabel>
                                <FormControl className="col-span-3">
                                    <SelectIcon value={field.value} onValueChange={field.onChange} />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}