import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";

export default function TextAreaInputDialog({
  children,
  title,
  description,
  value,
  defaultValue,
  onSave,
  onClose,
  onCancel,
  closeOnSave = true,
  trim = true,
}: PropsWithChildren<{
  title: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  onSave?: (test: string) => void;
  onClose?: () => void;
  onCancel?: () => void;
  closeOnSave?: boolean;
  trim?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const [_value, _setValue] = useState(value || defaultValue || "");

  useEffect(() => {
    _setValue(value || "");
  }, [value]);

  const close = useCallback(() => {
    setOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  const cancel = useCallback(() => {
    if (onCancel) onCancel();
    close();
  }, [onCancel, close]);

  const save = useCallback(() => {
    if (onSave) onSave(trim ? _value.trim() : _value);
    if (closeOnSave) close();
  }, [onSave, trim, _value, closeOnSave, close]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) setOpen(true);
        if (!value) close();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <textarea
          value={_value}
          onChange={(e) => _setValue(e.target.value)}
          autoFocus
          className="rounded-md border-gray-300 shadow-sm"
          placeholder="Zadajte text..."
        ></textarea>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={cancel}>
            Zrušiť
          </Button>
          <Button type="button" variant="default" onClick={save}>
            Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
