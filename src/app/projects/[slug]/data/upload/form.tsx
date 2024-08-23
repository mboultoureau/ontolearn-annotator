"use client";

import { createData } from "@/actions/data";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Project } from "@/lib/definitions";
import { AlertCircle, ImageIcon, ScanEye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormState } from "react-dom";
import { SubmitButton } from "./submit-button";


const initialState = {
    message: ""
}

export default function ProfileForm({ project }: { project: Project }) {

    // const t = useTranslations("Data.Upload");

    // const [state, uploadAction] = useFormState(createData.bind(null, project.id), initialState);

    // return (
    //     <form action={uploadAction} className="space-y-8">
    //         {state.message && (
    //             <Alert variant="destructive">
    //                 <AlertCircle className="h-4 w-4" />
    //                 <AlertTitle>{t('errorUnableToUpload')}</AlertTitle>
    //                 <AlertDescription>
    //                     {state.message}
    //                 </AlertDescription>
    //             </Alert>
    //         )}
    //         <Select defaultValue="large_image" name="datatype">
    //             <SelectTrigger className="w-full">
    //                 <SelectValue placeholder="Select a data type" />
    //             </SelectTrigger>
    //             <SelectContent>
    //                 <SelectItem value="image">
    //                     <div className="flex items-center">
    //                         <ImageIcon className="mr-2" />
    //                         Image
    //                     </div>
    //                 </SelectItem>
    //                 <SelectItem value="large_image">
    //                     <div className="flex items-center">
    //                         <ScanEye className="mr-2" />
    //                         Large Image
    //                     </div>
    //                 </SelectItem>
    //             </SelectContent>
    //         </Select>
    //         <Input name="file" type="file" multiple />
    //         <div className="flex justify-end">
    //             <SubmitButton />
    //         </div>
    //     </form>
    // )
}
