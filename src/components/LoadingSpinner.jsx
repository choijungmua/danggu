export default function LoadingSpinner({ message = "로딩 중...", className = "" }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <div className="text-lg text-gray-700">{message}</div>
      </div>
    </div>
  );
}