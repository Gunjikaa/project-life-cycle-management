import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Clock3 } from "lucide-react";
import {
  fetchPendingActions,
  getReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
  type PendingAction,
} from "../services/notificationService";

const priorityStyles = {
  HIGH: "bg-red-50 text-red-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<PendingAction[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(
    () => getReadNotificationIds()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await fetchPendingActions();
        setNotifications(data);
        setReadIds(getReadNotificationIds());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load notifications."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  const markRead = (id: string) => {
    markNotificationRead(id);
    setReadIds((current) => new Set(current).add(id));
  };

  const markAllRead = () => {
    markAllNotificationsRead(notifications.map((item) => item.id));
    setReadIds(new Set(notifications.map((item) => item.id)));
  };

  const openNotification = (notification: PendingAction) => {
    markRead(notification.id);
    navigate(notification.href);
  };

  const unreadCount = notifications.filter(
    (notification) => !readIds.has(notification.id)
  ).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => Number(readIds.has(a.id)) - Number(readIds.has(b.id))
  );

  if (loading) {
    return <p className="text-sm text-slate-500">Loading notifications...</p>;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Notifications</h2>
          <p className="mt-2 text-slate-500">
            Role-relevant updates generated from current pending workflow data.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <CheckCheck size={17} />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Bell className="mx-auto text-slate-400" size={34} />
          <p className="mt-3 font-medium text-slate-800">No notifications.</p>
          <p className="mt-1 text-sm text-slate-500">
            New notifications appear when relevant pending work is saved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotifications.map((notification) => {
            const isRead = readIds.has(notification.id);
            return (
              <div
                key={notification.id}
                className={`rounded-xl border p-5 shadow-sm ${
                  isRead
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50/40"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Clock3
                      size={20}
                      className={`mt-0.5 shrink-0 ${
                        notification.priority === "HIGH"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        {!isRead && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {notification.description}
                      </p>
                      <p className="mt-2 text-xs font-medium text-blue-700">
                        {notification.project.projectName} ({notification.project.projectId})
                      </p>
                      {notification.dueDate && (
                        <p className="mt-1 text-xs text-slate-500">
                          Due: {new Date(notification.dueDate).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[notification.priority]}`}>
                      {notification.status.replaceAll("_", " ")}
                    </span>
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => markRead(notification.id)}
                        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Check size={14} />
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      View project
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Notifications;
