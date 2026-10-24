import { apiFetch } from "./api";

export interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate: string | null;
  href: string;
  project: {
    id: number;
    projectId: string;
    projectName: string;
  };
}

export const notificationsUpdatedEvent = "plcms-notifications-updated";

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id ? String(user.id) : "unknown";
  } catch {
    return "unknown";
  }
};

const getReadStorageKey = () =>
  `plcms-read-notifications:${getCurrentUserId()}`;

export async function fetchPendingActions() {
  return apiFetch<PendingAction[]>("/api/pending-actions");
}

export function getReadNotificationIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(getReadStorageKey()) || "[]");
    return new Set<string>(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set<string>();
  }
}

function saveReadNotificationIds(ids: Set<string>) {
  localStorage.setItem(getReadStorageKey(), JSON.stringify([...ids]));
  window.dispatchEvent(new Event(notificationsUpdatedEvent));
}

export function markNotificationRead(id: string) {
  const ids = getReadNotificationIds();
  ids.add(id);
  saveReadNotificationIds(ids);
}

export function markAllNotificationsRead(actionIds: string[]) {
  const ids = getReadNotificationIds();
  actionIds.forEach((id) => ids.add(id));
  saveReadNotificationIds(ids);
}

export function countUnreadNotifications(actions: PendingAction[]) {
  const readIds = getReadNotificationIds();
  return actions.filter((action) => !readIds.has(action.id)).length;
}
