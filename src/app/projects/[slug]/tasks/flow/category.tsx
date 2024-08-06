import Image from "next/image";
import { ReactNode } from "react";

type Props = {
    text: string;
    description?: string;
    image?: string;
    slotImage?: ReactNode;
    onClick?: () => void;
}

export default function Category({ text, description, slotImage, image, onClick }: Props) {
    return (
        <div
            className="flex items-center gap-4 rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md cursor-pointer hover:shadow-md hover:bg-muted"
            onClick={onClick}
        >
            {slotImage && slotImage}
            {!slotImage && image && (
                <Image
                    width={40}
                    height={40}
                    className="aspect-square rounded-md object-cover"
                    alt="Input"
                    src={image} />
            )}
            <div className="space-y-1">
                <h3 className="text-lg font-medium">{text}</h3>
                {description && (<p className="text-muted-foreground">{description}</p>)}
            </div>
        </div>
    )
}