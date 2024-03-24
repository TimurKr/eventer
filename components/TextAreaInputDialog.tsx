import { Button, ConfirmButton } from "@/components/ui/button";
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
  onReset,
  closeOnSave = true,
  closeOnReset = true,
  trim = true,
}: PropsWithChildren<{
  title: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  onSave?: (test: string) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  closeOnSave?: boolean;
  closeOnReset?: boolean;
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

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
    close();
  }, [onCancel, close]);

  const handleSave = useCallback(() => {
    if (onSave) onSave(trim ? _value.trim() : _value);
    if (closeOnSave) close();
  }, [onSave, trim, _value, closeOnSave, close]);

  const handleReset = useCallback(() => {
    if (onReset) onReset();
    if (closeOnReset) close();
  }, [onReset, closeOnReset, close]);

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
          {onReset && (
            <ConfirmButton
              variant="destructive"
              onConfirm={handleReset}
              title={"Naozaj chcete vymazať text?"}
              confirmLabel={"Vymazať"}
            >
              <Button type="button" variant="ghost" className="sm:me-auto">
                Reset
              </Button>
            </ConfirmButton>
          )}
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Zrušiť
          </Button>
          <Button type="button" variant="default" onClick={handleSave}>
            Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
