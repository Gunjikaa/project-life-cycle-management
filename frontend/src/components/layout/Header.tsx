import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Search } from "lucide-react";

function Header() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};
  return (
    <header className="h-16 border-b bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Project Life Cycle Management System
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <form
  onSubmit={(event) => {
    event.preventDefault();

    const searchText = search.trim();

    if (!searchText) {
      navigate("/projects");
      return;
    }

    navigate(
      `/projects?search=${encodeURIComponent(searchText)}`
    );
  }}
  className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2"
>
  <Search size={18} className="text-slate-400" />

  <input
    type="text"
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    placeholder="Search projects..."
    className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
  />
</form>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <button
  type="button"
  onClick={handleLogout}
  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
  aria-label="Logout"
>
  <LogOut size={20} />
</button>
        </div>
      </div>
    </header>
  );
}

export default Header;