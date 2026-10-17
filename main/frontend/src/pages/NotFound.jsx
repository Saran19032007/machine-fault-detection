import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-300">404</h1>
      <p className="mt-2 text-slate-500">Page not found.</p>
      <Link to="/" className="mt-4 text-sm font-medium text-sky-500 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
