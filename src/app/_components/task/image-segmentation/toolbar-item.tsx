import { Button } from "@/app/_components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { LucideIcon } from "lucide-react";

type Props = {
    icon: LucideIcon,
    label: string,
    selected?: boolean,
    onClick: () => void
}

export default function ToolbarItem({ icon: Icon, label, selected, onClick }: Props) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={selected ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""} onClick={onClick}>
                        <Icon className="w-[40px]" />
                        <span className="sr-only">{label}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="hello">
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}