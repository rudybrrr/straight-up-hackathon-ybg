import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@/components/ui/alert";

export function ErrorState({
  title,
  description,
  onRetry
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" className="items-start">
      <AlertIcon />
      <div className="flex-1 space-y-3">
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={onRetry}>
          Retry processing
        </Button>
      </div>
    </Alert>
  );
}

