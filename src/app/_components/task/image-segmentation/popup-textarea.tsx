import { FieldTextarea } from "./settings-types";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/app/_components/ui/textarea";
import { useTranslations } from "next-intl";

type Props = FieldTextarea & {
  defaultValue?: string;
  onValueChange: (value: string) => void;
};

export default function PopupTextarea({
  label,
  isTranslatable,
  placeholder,
  defaultValue,
  onValueChange,
}: Props) {
  const t = useTranslations("Task.ImageSegmentation");

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex justify-between items-center mb-1">
        <Label>{isTranslatable ? t(label) : label}</Label>
      </div>
      <Textarea
        value={defaultValue}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={
          placeholder && (isTranslatable ? t(placeholder) : placeholder)
        }
      />
    </div>
  );
}
