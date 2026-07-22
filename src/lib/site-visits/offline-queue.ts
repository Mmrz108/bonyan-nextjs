const QUEUE_KEY = "bonyan.siteVisits.offlineQueue";

export type OfflineQueueItem = {
  id: string;
  createdAt: string;
  label: string;
  kind:
    | "schedule"
    | "check_in"
    | "check_out"
    | "complete"
    | "issue_photo"
    | "checklist_results";
  payload: Record<string, unknown>;
};

function readQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineQueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function listOfflineQueue(): OfflineQueueItem[] {
  return readQueue();
}

export function enqueueOfflineAction(
  item: Omit<OfflineQueueItem, "id" | "createdAt">,
): OfflineQueueItem {
  const next: OfflineQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const queue = readQueue();
  queue.push(next);
  writeQueue(queue);
  return next;
}

export function removeOfflineAction(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function clearOfflineQueue() {
  writeQueue([]);
}
