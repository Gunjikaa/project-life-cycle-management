import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import {
  fetchPendingActions,
  type PendingAction,
} from "../services/notificationService";

const priorityStyles = {
  HIGH: "bg-red-50 text-red-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};

function PendingActions() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActions = async () => {
      try {
        const data = await fetchPendingActions();
        setActions(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load pending actions."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadActions();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading pending actions...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Pending Actions</h2>
        <p className="mt-2 text-slate-500">
          Outstanding workflow items relevant to your current role.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-green-600" size={34} />
          <p className="mt-3 font-medium text-slate-800">No pending actions.</p>
          <p className="mt-1 text-sm text-slate-500">
            Completed items and tasks outside your role are not included.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(action.href)}
              className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  {action.priority === "HIGH" ? (
                    <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
                  ) : (
                    <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={20} />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{action.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                    <p className="mt-2 text-xs font-medium text-blue-700">
                      {action.project.projectName} ({action.project.projectId})
                    </p>
                    {action.dueDate && (
                      <p className="mt-1 text-xs text-slate-500">
                        Due: {new Date(action.dueDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[action.priority]}`}>
                  {action.status.replaceAll("_", " ")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingActions;
