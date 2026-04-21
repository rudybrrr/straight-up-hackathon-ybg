import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction
}: {
  icon: ReactNode;
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <Card className="border-dashed bg-card/70">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-muted-foreground">
          {icon}
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        {(primaryActionLabel || secondaryActionLabel) && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {primaryActionLabel ? (
              <Button type="button" onClick={onPrimaryAction}>
                {primaryActionLabel}
              </Button>
            ) : null}
            {secondaryActionLabel ? (
              <Button type="button" variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

