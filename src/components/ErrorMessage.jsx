export default function ErrorMessage({ 
  title = "에러가 발생했습니다", 
  message, 
  onRetry, 
  className = "" 
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        {message && (
          <p className="text-red-600 mb-4 break-words">{message}</p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}