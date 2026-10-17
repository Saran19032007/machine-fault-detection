export default function ConnectionDot({ connected, label }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
      </span>
      <span className={connected ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
        {label}: {connected ? "CONNECTED" : "DISCONNECTED"}
      </span>
    </div>
  );
}
