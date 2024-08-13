import { FieldInput } from "./settings-types";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { useTranslations } from "next-intl";

type Props = FieldInput & {
  defaultValue?: string;
  onValueChange: (value: string) => void;
};

export default function PopupInput({
  label,
  isTranslatable,
  placeholder,
  fieldType,
  defaultValue,
  onValueChange,
}: Props) {
  const t = useTranslations("Task.ImageSegmentation");

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex justify-between items-center mb-1">
        <Label>{isTranslatable ? t(label) : label}</Label>
      </div>
      <Input
        type={fieldType}
        value={defaultValue ?? ""}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={
          placeholder && (isTranslatable ? t(placeholder) : placeholder)
        }
      />
    </div>
  );
}
