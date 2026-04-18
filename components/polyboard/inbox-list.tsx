import { InboxCard } from "@/components/polyboard/inbox-card";
import type { InboxItem } from "@/types/polyboard";

export function InboxList({
  items,
  selectedItemId,
  onSelect
}: {
  items: InboxItem[];
  selectedItemId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <InboxCard
          key={item.id}
          item={item}
          selected={item.id === selectedItemId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

