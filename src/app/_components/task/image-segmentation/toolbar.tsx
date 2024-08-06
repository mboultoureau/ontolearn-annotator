import { Separator } from "@/app/_components/ui/separator";
import { Maximize, MousePointer2, PenTool, RectangleHorizontal, View, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import ToolbarItem from "./toolbar-item";

type Props = {
    selectedTool: string;
    onButtonClicked: (button: string) => void;
}

export default function Toolbar({ selectedTool, onButtonClicked }: Props) {
    const t = useTranslations("Task.ImageSegmentation");

    const drawingTools = [
        {
            value: 'mouse',
            label: t('mouse'),
            icon: MousePointer2
        },
        {
            value: 'rectangle',
            label: t('rectangle'),
            icon: RectangleHorizontal
        },
        {
            value: 'polygon',
            label: t('polygon'),
            icon: PenTool
        }
    ]
    
    const buttons = [
        {
            value: 'zoom-in',
            label: t('zoomIn'),
            icon: ZoomIn
        },
        {
            value: 'zoom-out',
            label: t('zoomOut'),
            icon: ZoomOut
        },
        {
            value: 'fit-view',
            label: t('fitView'),
            icon: View
        },
        {
            value: 'fullscreen',
            label: t('fullscreen'),
            icon: Maximize
        }
    ]

    return (
        <div className="flex items-center gap-2 absolute bg-background rounded-lg bottom-2 left-0 right-0 mx-auto z-[1] p-2 w-[361px] absolute">
            {drawingTools.map((tool) => (
                <ToolbarItem
                    selected={selectedTool === tool.value}
                    key={tool.value}
                    label={tool.label}
                    icon={tool.icon}
                    onClick={() => onButtonClicked(tool.value)}
                />
            ))}
            <Separator orientation="vertical" className="mx-1 h-6" />
            {buttons.map((button) => (
                <ToolbarItem
                    key={button.value}
                    label={button.label}
                    icon={button.icon}
                    onClick={() => onButtonClicked(button.value)}
                />
            ))}
        </div>
    )
}