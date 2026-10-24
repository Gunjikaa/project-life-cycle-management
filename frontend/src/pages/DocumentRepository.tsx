import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { apiFetch } from "../services/api";

interface RepositoryDocument {
  id: number;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  description: string | null;
  createdAt: string;
  project: {
    id: number;
    projectId: string;
    projectName: string;
  };
  workflowActivity: {
    id: number;
    activityType: string;
  } | null;
  uploadedBy: {
    id: number;
    name: string;
  };
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatActivity = (value: string) =>
  value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

const formatSize = (bytes: number | null) => {
  if (bytes == null) return "Size unavailable";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function DocumentRepository() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<RepositoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await apiFetch<RepositoryDocument[]>("/api/documents");
        setDocuments(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load document repository."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDocuments();
  }, []);

  const downloadDocument = async (document: RepositoryDocument) => {
    try {
      setDownloadingId(document.id);
      setError("");
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
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading document repository...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Document Repository</h2>
        <p className="mt-2 text-slate-500">
          Uploaded project documents available to your current role.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <FileText className="mx-auto text-slate-400" size={32} />
          <p className="mt-3 font-medium text-slate-700">No accessible documents found.</p>
          <p className="mt-1 text-sm text-slate-500">
            Documents uploaded against workflow activities will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-200">
            {documents.map((document) => (
              <div key={document.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">
                      {document.fileName}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${document.project.id}`)}
                      className="mt-1 text-left text-sm font-medium text-blue-700 hover:underline"
                    >
                      {document.project.projectName} ({document.project.projectId})
                    </button>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Activity: {document.workflowActivity
                          ? formatActivity(document.workflowActivity.activityType)
                          : "General project document"}
                      </span>
                      <span>Uploaded: {formatDate(document.createdAt)}</span>
                      <span>{formatSize(document.fileSize)}</span>
                      <span>By: {document.uploadedBy.name}</span>
                    </div>
                    {document.description && (
                      <p className="mt-3 text-sm text-slate-600">
                        {document.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void downloadDocument(document)}
                    disabled={downloadingId === document.id}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Download size={16} />
                    {downloadingId === document.id ? "Downloading..." : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentRepository;
