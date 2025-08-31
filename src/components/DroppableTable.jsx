import { useDrop } from "react-dnd";
import DraggableUser from "./DraggableUser";

export default function DroppableTable({
  tableNumber,
  assignedUsers = [],
  onUserDrop,
  onTableClick,
  onRemoveUser,
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "USER",
    drop: (item) => onUserDrop(tableNumber, item.user),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getTableStatus = () => {
    if (assignedUsers.length > 0) {
      return {
        text: `${assignedUsers.length}명 사용 중`,
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        status: "사용 중",
      };
    }
    return {
      text: "사용 가능",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-100",
      status: "빈 테이블",
    };
  };

  const tableStatus = getTableStatus();

  const handleUserClick = (user) => {
    // 테이블 내부 사용자 클릭 시 제거
    onRemoveUser(tableNumber, user.id);
  };

  return (
    <div
      ref={drop}
      onClick={() => onTableClick(tableNumber, assignedUsers)}
      className={`${tableStatus.bgColor} rounded-2xl border ${
        tableStatus.borderColor
      } transition-all cursor-pointer ${
        isOver && canDrop ? "ring-2 ring-blue-400 ring-opacity-30" : ""
      } ${isOver ? "scale-[1.02]" : ""} hover:scale-[1.01]`}
      style={{ height: "200px" }}
    >
      <div className="h-full flex flex-col justify-center items-center p-4 relative">
        <div className="text-lg font-semibold text-gray-900 mb-2">
          테이블 {tableNumber}
        </div>

        {assignedUsers.length > 0 ? (
          <div className="text-center w-full">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {assignedUsers.length}명
            </div>

            {/* 사용자 목록 - 드래그 가능 */}
            <div className="space-y-1">
              {assignedUsers.slice(0, 3).map((user, index) => (
                <div
                  key={user.id}
                  className="flex justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DraggableUser
                    user={user}
                    onClick={handleUserClick}
                    isTableUser={true}
                  />
                </div>
              ))}
              {assignedUsers.length > 3 && (
                <div className="bg-gray-50 rounded-lg px-2 py-1 text-xs text-gray-500 font-medium">
                  +{assignedUsers.length - 3}명 더
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">{tableStatus.text}</div>
        )}

        {isOver && canDrop && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-80 rounded-2xl flex items-center justify-center">
            <div className="text-blue-600 font-semibold text-sm">
              여기에 배치
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
