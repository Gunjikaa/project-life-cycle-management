import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../../services/api";

type ClosureType = "TECHNICAL" | "ADMINISTRATIVE" | "FINANCIAL";

interface ProjectSummary {
  id: number;
  projectId: string;
  projectName: string;
  objective: string;
  projectDirector: string;
  concernedLab: string;
  estimatedCost: number;
  startDate: string;
  completionDate: string;
  phase: string;
}

interface SupportingDocument {
  id: number;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
}

interface SupportingActivity {
  id: number;
  activityType: string;
  status: string;
  remarks?: string | null;
  documents: SupportingDocument[];
}

interface EvaluationRecord {
  id: number;
  status: string;
  evaluator: string | null;
  evaluatedAt: string | null;
  outcome: string | null;
  remarks: string | null;
}

interface ClosureRecord {
  id: number;
  closureType: ClosureType;
  status: string;
  completedAt: string | null;
  remarks: string | null;
  approvedBy: string | null;
}

interface EvaluationResponse {
  evaluation: EvaluationRecord | null;
  activity: SupportingActivity | null;
}

interface ClosureResponse {
  closureType: ClosureType;
  closure: ClosureRecord | null;
  activity: SupportingActivity | null;
}

interface ReportActivity {
  activityType: string;
  status: string;
  remarks?: string | null;
  createdAt: string;
  approvals?: Array<{
    decision: string;
    remarks?: string | null;
    decidedAt?: string | null;
  }>;
  documents?: SupportingDocument[];
}

interface ReportReview {
  reviewType: "PMRB" | "EB";
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  remarks: string | null;
}

interface EvaluationClosurePanelProps {
  project: ProjectSummary;
  activities: ReportActivity[];
  reviews: ReportReview[];
  canManageWorkflow: boolean;
  canReview: boolean;
}

interface EvaluationDraft {
  status: string;
  evaluatedAt: string;
  outcome: string;
  remarks: string;
}

interface ClosureDraft {
  status: string;
  completedAt: string;
  remarks: string;
}

const closureTypes: ClosureType[] = [
  "TECHNICAL",
  "ADMINISTRATIVE",
  "FINANCIAL",
];

const closureLabels: Record<ClosureType, string> = {
  TECHNICAL: "Technical Closure",
  ADMINISTRATIVE: "Administrative Closure",
  FINANCIAL: "TS / Financial Closure",
};

const emptyEvaluationDraft: EvaluationDraft = {
  status: "PENDING",
  evaluatedAt: "",
  outcome: "",
  remarks: "",
};

const emptyClosureDrafts: Record<ClosureType, ClosureDraft> = {
  TECHNICAL: { status: "PENDING", completedAt: "", remarks: "" },
  ADMINISTRATIVE: { status: "PENDING", completedAt: "", remarks: "" },
  FINANCIAL: { status: "PENDING", completedAt: "", remarks: "" },
};

const dateInputValue = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function EvaluationClosurePanel({
  project,
  activities,
  reviews,
  canManageWorkflow,
  canReview,
}: EvaluationClosurePanelProps) {
  const [evaluationData, setEvaluationData] =
    useState<EvaluationResponse | null>(null);
  const [closures, setClosures] = useState<ClosureResponse[]>([]);
  const [evaluationDraft, setEvaluationDraft] = useState<EvaluationDraft>(
    emptyEvaluationDraft
  );
  const [closureDrafts, setClosureDrafts] =
    useState<Record<ClosureType, ClosureDraft>>(emptyClosureDrafts);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const evaluationAvailable = ["MONITORING", "CLOSURE", "POST_CLOSURE"].includes(
    project.phase
  );
  const closureAvailable = ["CLOSURE", "POST_CLOSURE"].includes(project.phase);
  const canEditEvaluation = canReview && evaluationAvailable;
  const canEditClosure = canManageWorkflow && closureAvailable;

  const loadData = useCallback(async () => {
    try {
      const [evaluationResponse, closureResponse] = await Promise.all([
        apiFetch<EvaluationResponse>(`/api/projects/${project.id}/evaluation`),
        apiFetch<ClosureResponse[]>(`/api/projects/${project.id}/closures`),
      ]);

      setEvaluationData(evaluationResponse);
      setClosures(closureResponse);

      const evaluation = evaluationResponse.evaluation;
      setEvaluationDraft(
        evaluation
          ? {
              status: evaluation.status,
              evaluatedAt: dateInputValue(evaluation.evaluatedAt),
              outcome: evaluation.outcome ?? "",
              remarks: evaluation.remarks ?? "",
            }
          : emptyEvaluationDraft
      );

      const nextClosureDrafts = { ...emptyClosureDrafts };
      for (const item of closureResponse) {
        if (item.closure) {
          nextClosureDrafts[item.closureType] = {
            status: item.closure.status,
            completedAt: dateInputValue(item.closure.completedAt),
            remarks: item.closure.remarks ?? "",
          };
        }
      }
      setClosureDrafts(nextClosureDrafts);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load evaluation and closure data."
      );
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const saveEvaluation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSavingKey("evaluation");
      const response = await apiFetch<EvaluationResponse>(
        `/api/projects/${project.id}/evaluation`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...evaluationDraft,
            evaluatedAt: evaluationDraft.evaluatedAt
              ? new Date(`${evaluationDraft.evaluatedAt}T12:00:00`).toISOString()
              : null,
          }),
        }
      );
      setEvaluationData(response);
      setError("");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save evaluation."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const saveClosure = async (
    closureType: ClosureType,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const draft = closureDrafts[closureType];

    try {
      setSavingKey(closureType);
      const response = await apiFetch<{
        closure: ClosureRecord;
        activity: SupportingActivity;
      }>(`/api/projects/${project.id}/closures/${closureType}`, {
        method: "PUT",
        body: JSON.stringify({
          ...draft,
          completedAt: draft.completedAt
            ? new Date(`${draft.completedAt}T12:00:00`).toISOString()
            : null,
        }),
      });

      setClosures((current) =>
        current.map((item) =>
          item.closureType === closureType
            ? {
                closureType,
                closure: response.closure,
                activity: response.activity,
              }
            : item
        )
      );
      setError("");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save closure."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const uploadSupportingDocument = async (
    activityId: number,
    key: string,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Please select a supporting document.");
      return;
    }

    try {
      setSavingKey(`upload-${key}`);
      await apiFetch(
        `/api/projects/${project.id}/activities/${activityId}/documents`,
        { method: "POST", body: formData }
      );
      form.reset();
      await loadData();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload supporting document."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const downloadDocument = async (document: SupportingDocument) => {
    try {
      const response = await apiFetch(
        `/api/documents/${document.id}/download`,
        {},
        true
      );
      const blobUrl = window.URL.createObjectURL(await response.blob());
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document.fileName;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download document."
      );
    }
  };

  const printReport = (reportType: "sanction" | "minutes" | "closure") => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      setError("Allow pop-ups to open the printable report.");
      return;
    }
    reportWindow.opener = null;

    const sanctionTypes = new Set([
      "AON",
      "SOC",
      "COSTING",
      "ADDIFA_CONCURRENCE",
      "SECRETARY_SANCTION",
      "GL_ISSUE",
      "PROJECT_SANCTION",
    ]);
    const sanctionActivities = activities.filter((activity) =>
      sanctionTypes.has(activity.activityType)
    );
    const completedReviews = reviews.filter(
      (review) => review.status === "COMPLETED"
    );

    let title = "Project Report";
    let content = "";

    if (reportType === "sanction") {
      title = "Sanction Workflow Summary";
      content = `
        <p class="note">Prototype summary generated from saved sanction-related workflow records. Required official document types remain subject to mentor confirmation.</p>
        <h2>Sanction Activities</h2>
        ${
          sanctionActivities.length
            ? sanctionActivities
                .map(
                  (activity) => `<section><h3>${escapeHtml(activity.activityType)}</h3>
                    <p><strong>Status:</strong> ${escapeHtml(activity.status)}</p>
                    <p><strong>Remarks:</strong> ${escapeHtml(activity.remarks || "—")}</p>
                    <p><strong>Approvals:</strong> ${escapeHtml(activity.approvals?.map((item) => item.decision).join(", ") || "None recorded")}</p>
                    <p><strong>Documents:</strong> ${escapeHtml(activity.documents?.map((item) => item.fileName).join(", ") || "None recorded")}</p></section>`
                )
                .join("")
            : "<p>No sanction-related workflow activities have been saved.</p>"
        }`;
    } else if (reportType === "minutes") {
      title = "PMRB / EB Recorded Meeting Minutes";
      content = `
        <p class="note">This printable record uses saved review dates and remarks; it does not fabricate attendees, decisions, or formal minutes.</p>
        ${
          completedReviews.length
            ? completedReviews
                .map(
                  (review) => `<section><h3>${escapeHtml(review.reviewType)} Review</h3>
                    <p><strong>Scheduled:</strong> ${escapeHtml(formatDate(review.scheduledAt))}</p>
                    <p><strong>Completed:</strong> ${escapeHtml(formatDate(review.completedAt))}</p>
                    <p><strong>Recorded remarks:</strong> ${escapeHtml(review.remarks || "No remarks recorded")}</p></section>`
                )
                .join("")
            : "<p>No completed PMRB or EB reviews are recorded.</p>"
        }`;
    } else {
      title = "Evaluation and Closure Report";
      const evaluation = evaluationData?.evaluation;
      content = `
        <h2>Independent Evaluation</h2>
        <p><strong>Status:</strong> ${escapeHtml(evaluation?.status || "Not started")}</p>
        <p><strong>Evaluator:</strong> ${escapeHtml(evaluation?.evaluator || "—")}</p>
        <p><strong>Date:</strong> ${escapeHtml(formatDate(evaluation?.evaluatedAt))}</p>
        <p><strong>Outcome:</strong> ${escapeHtml(evaluation?.outcome || "—")}</p>
        <p><strong>Remarks:</strong> ${escapeHtml(evaluation?.remarks || "—")}</p>
        <h2>Closure Records</h2>
        ${closures
          .map(
            (item) => `<section><h3>${escapeHtml(closureLabels[item.closureType])}</h3>
              <p><strong>Status:</strong> ${escapeHtml(item.closure?.status || "Not started")}</p>
              <p><strong>Completed:</strong> ${escapeHtml(formatDate(item.closure?.completedAt))}</p>
              <p><strong>Responsible user:</strong> ${escapeHtml(item.closure?.approvedBy || "—")}</p>
              <p><strong>Remarks:</strong> ${escapeHtml(item.closure?.remarks || "—")}</p></section>`
          )
          .join("")}`;
    }

    reportWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
      <style>body{font-family:Arial,sans-serif;margin:36px;color:#172033}h1{margin-bottom:4px}h2{border-bottom:1px solid #ccd3dd;padding-bottom:6px;margin-top:28px}section{border:1px solid #d9dee7;border-radius:8px;padding:14px;margin:12px 0}.meta{color:#526078}.note{background:#f3f6fa;padding:12px;border-radius:8px}p{line-height:1.45}@media print{button{display:none}}</style>
      </head><body><button onclick="window.print()">Print / Save as PDF</button>
      <h1>${escapeHtml(title)}</h1><p class="meta">${escapeHtml(project.projectName)} (${escapeHtml(project.projectId)})</p>
      <p><strong>Director:</strong> ${escapeHtml(project.projectDirector)} &nbsp; <strong>Lab:</strong> ${escapeHtml(project.concernedLab)}</p>
      <p><strong>Current phase:</strong> ${escapeHtml(project.phase)}</p>${content}</body></html>`);
    reportWindow.document.close();
  };

  const renderDocuments = (
    activity: SupportingActivity | null,
    key: string,
    canUpload: boolean
  ) => (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">Supporting Documents</p>
      {activity?.documents.length ? (
        <div className="mt-2 space-y-2">
          {activity.documents.map((document) => (
            <button
              key={document.id}
              type="button"
              onClick={() => void downloadDocument(document)}
              className="block text-left text-sm font-medium text-blue-700 hover:underline"
            >
              {document.fileName}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No supporting document uploaded.</p>
      )}

      {activity && canUpload && (
        <form
          className="mt-3 flex flex-col gap-2 md:flex-row"
          onSubmit={(event) =>
            void uploadSupportingDocument(activity.id, key, event)
          }
        >
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="min-w-0 flex-1 text-sm"
          />
          <input
            type="hidden"
            name="description"
            value={`${key} supporting document`}
          />
          <button
            type="submit"
            disabled={savingKey === `upload-${key}`}
            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {savingKey === `upload-${key}` ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}
      {!activity && canUpload && (
        <p className="mt-2 text-xs text-amber-700">
          Save this item as In Progress before uploading its document.
        </p>
      )}
    </div>
  );

  if (loading) {
    return <p className="mt-6 text-sm text-slate-500">Loading evaluation and closure...</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Printable Reports</h3>
        <p className="mt-1 text-sm text-slate-500">
          Reports contain only data currently saved in PLCMS.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => printReport("sanction")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Sanction Summary
          </button>
          <button type="button" onClick={() => printReport("minutes")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Review Minutes
          </button>
          <button type="button" onClick={() => printReport("closure")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Evaluation / Closure Report
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Independent Project Evaluation</h3>
        <p className="mt-1 text-sm text-slate-500">
          Available from Monitoring. Completion requires a saved outcome, date, remarks, and supporting document.
        </p>
        {!evaluationAvailable && (
          <p className="mt-2 text-sm font-medium text-amber-700">
            This project has not reached Monitoring.
          </p>
        )}

        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={saveEvaluation}>
          <select value={evaluationDraft.status} onChange={(event) => setEvaluationDraft((current) => ({ ...current, status: event.target.value }))} disabled={!canEditEvaluation} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="RETURNED">Returned</option>
          </select>
          <input type="date" value={evaluationDraft.evaluatedAt} onChange={(event) => setEvaluationDraft((current) => ({ ...current, evaluatedAt: event.target.value }))} disabled={!canEditEvaluation} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <input type="text" value={evaluationDraft.outcome} onChange={(event) => setEvaluationDraft((current) => ({ ...current, outcome: event.target.value }))} disabled={!canEditEvaluation} placeholder="Evaluation outcome" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm md:col-span-2" />
          <textarea value={evaluationDraft.remarks} onChange={(event) => setEvaluationDraft((current) => ({ ...current, remarks: event.target.value }))} disabled={!canEditEvaluation} placeholder="Evaluation remarks" rows={3} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm md:col-span-2" />
          {evaluationData?.evaluation?.evaluator && (
            <p className="text-sm text-slate-500 md:col-span-2">Responsible evaluator: {evaluationData.evaluation.evaluator}</p>
          )}
          {canEditEvaluation && (
            <button type="submit" disabled={savingKey === "evaluation"} className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              {savingKey === "evaluation" ? "Saving..." : "Save Evaluation"}
            </button>
          )}
        </form>
        {renderDocuments(evaluationData?.activity ?? null, "evaluation", canEditEvaluation)}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Project Closure</h3>
        <p className="mt-1 text-sm text-slate-500">
          Available in Closure. Each completed closure requires a date, remarks, responsible user, and supporting document.
        </p>
        {!closureAvailable && (
          <p className="mt-2 text-sm font-medium text-amber-700">
            This project has not reached the Closure phase.
          </p>
        )}
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {closureTypes.map((closureType) => {
            const item = closures.find((entry) => entry.closureType === closureType);
            const draft = closureDrafts[closureType];
            return (
              <form key={closureType} onSubmit={(event) => void saveClosure(closureType, event)} className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900">{closureLabels[closureType]}</h4>
                <div className="mt-3 space-y-3">
                  <select value={draft.status} onChange={(event) => setClosureDrafts((current) => ({ ...current, [closureType]: { ...current[closureType], status: event.target.value } }))} disabled={!canEditClosure} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                  <input type="date" value={draft.completedAt} onChange={(event) => setClosureDrafts((current) => ({ ...current, [closureType]: { ...current[closureType], completedAt: event.target.value } }))} disabled={!canEditClosure} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <textarea value={draft.remarks} onChange={(event) => setClosureDrafts((current) => ({ ...current, [closureType]: { ...current[closureType], remarks: event.target.value } }))} disabled={!canEditClosure} placeholder="Closure remarks" rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  {item?.closure?.approvedBy && <p className="text-xs text-slate-500">Responsible user: {item.closure.approvedBy}</p>}
                  {canEditClosure && (
                    <button type="submit" disabled={savingKey === closureType} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                      {savingKey === closureType ? "Saving..." : "Save Closure"}
                    </button>
                  )}
                </div>
                {renderDocuments(item?.activity ?? null, closureType.toLowerCase(), canEditClosure)}
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EvaluationClosurePanel;
