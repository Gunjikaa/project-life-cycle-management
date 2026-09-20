
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/projectService";

function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectId: "",
    projectName: "",
    objective: "",
    projectDirector: "",
    concernedLab: "",
    estimatedCost: "",
    startDate: "",
    completionDate: "",
    remarks: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  

  setError("");
  setSuccess("");


  if (
    !formData.projectId ||
    !formData.projectName ||
    !formData.objective ||
    !formData.projectDirector ||
    !formData.concernedLab ||
    !formData.estimatedCost ||
    !formData.startDate ||
    !formData.completionDate
  ) {
    setError("Please fill in all required fields.");
    return;
  }
  const estimatedCost = Number(formData.estimatedCost);

if (estimatedCost <= 0) {
  setError("Estimated cost must be greater than 0.");
  return;
}

if (
  new Date(formData.completionDate) <
  new Date(formData.startDate)
) {
  setError("Completion date cannot be before start date.");
  return;
}
  
   try {
    const project = await createProject(formData);

    setSuccess("Project created successfully.");

    setTimeout(() => {
      navigate(`/projects/${project.id}`);
    }, 500);
  }  catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to create project."
    );
  }
};
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Create Project
        </h2>

        <p className="mt-2 text-slate-500">
          Create a new project and begin its lifecycle.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6"
        >
        {error && (
  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {error}
  </div>
)}
{success && (
  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
    {success}
  </div>
)}
          {/* Project ID */}
          <div>
            <label
              htmlFor="projectId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Project ID
            </label>

           <input
  id="projectId"
  type="text"
  placeholder="e.g. PLCM-001"
  value={formData.projectId}
  onChange={(e) =>
    setFormData({
      ...formData,
      projectId: e.target.value,
    })
  }
  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
/>
          </div>

          {/* Project Name */}
          <div>
            <label
              htmlFor="projectName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Project Name
            </label>

            <input
              id="projectName"
              type="text"
              placeholder="Enter project name"
              value={formData.projectName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  projectName: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Project Objective */}
          <div>
            <label
              htmlFor="objective"
              className="mb-2 block text-sm font-medium text-slate-700"

            >
              Project Objective
            </label>

            <textarea
              id="objective"
              rows={4}
              placeholder="Describe the objective of the project"
              value={formData.objective}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  objective: e.target.value,
                })
              }
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Project Director + Concerned Lab */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="projectDirector"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Project Director
              </label>

              <input
                id="projectDirector"
                type="text"
                placeholder="Enter project director"
                value={formData.projectDirector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectDirector: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="concernedLab"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Concerned Lab
              </label>

              <input
                id="concernedLab"
                type="text"
                placeholder="Enter concerned lab"
                value={formData.concernedLab}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    concernedLab: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Estimated Cost */}
          <div>
            <label
              htmlFor="estimatedCost"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Estimated Cost
            </label>

            <input
              id="estimatedCost"
              type="number"
              placeholder="Enter estimated cost"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedCost: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Dates */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Start Date
              </label>

              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="completionDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Expected Completion Date
              </label>

              <input
                id="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    completionDate: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label
              htmlFor="remarks"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Remarks
            </label>

            <textarea
              id="remarks"
              rows={3}
              placeholder="Additional remarks"
                value={formData.remarks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  remarks: e.target.value,
                })
              }
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <button
  type="button"
  onClick={() => navigate("/projects")}
  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
>
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;