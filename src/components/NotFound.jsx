export default function NotFound({ 
  title = "데이터가 없습니다", 
  message = "요청하신 내용을 찾을 수 없습니다.", 
  className = "" 
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 ${className}`}>
      <h2 className="text-xl font-bold text-gray-600 mb-2">{title}</h2>
      <p className="text-gray-500 text-center max-w-md">{message}</p>
    </div>
  );
}