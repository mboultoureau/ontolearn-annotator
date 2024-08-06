import { z } from "zod";

const authorizedExtensions = ["jpg", "jpeg", "png", "gif"];

export const uploadImageInputSchema = z.object({
    image: (typeof window === "undefined" ? z.any() : z.instanceof(FileList))
        .transform((value) => value instanceof File ? value : value?.item(0)! || {})
        .refine(
            (file) => file.size > 0 && file.size < 2 * 1024 * 1024,
            "Image size must be less than 2MB"
        )
        .refine(
            (file) => {
                if (!file.name) return false;
                const extension = file.name.split(".").pop();
                return extension && authorizedExtensions.includes(extension);
            },
            "Invalid image type"
        )
})