import { useDrop } from "react-dnd";
import DraggableUser from "./DraggableUser";

export default function DroppableTable({
  tableNumber,
  assignedUsers = [],
  onUserDrop,
  onTableClick,
  onRemoveUser,
  onSetAllUsersToWait,
  isMobile = false,
  isSelectionMode = false,
  selectedUser = null,
}) {
  // react-dnd droppable (모바일에서는 비활성화)
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "USER",
    drop: (item, monitor) => {
      if (!isMobile && !monitor.didDrop()) {
        onUserDrop(tableNumber, item.user);
        return { dropped: true };
      }
    },
    canDrop: (item) => {
      if (isMobile) return false;
      const user = item.user;
      const isAlreadyInThisTable = assignedUsers.some(u => u.id === user.id);
      return !isAlreadyInThisTable;
    },
    collect: (monitor) => ({
      isOver: !isMobile && monitor.isOver() && monitor.canDrop(),
      canDrop: !isMobile && monitor.canDrop(),
    }),
  });

  const handleUserClick = (user) => {
    onRemoveUser(tableNumber, user.id);
  };

  const handleSetAllToWait = (e) => {
    e.stopPropagation();
    if (assignedUsers.length > 0) {
      onSetAllUsersToWait(assignedUsers);
    }
  };

  // 모바일에서 선택 모드일 때 선택된 사용자가 이 테이블에 할당 가능한지 확인
  const canAssignSelectedUser = isMobile && isSelectionMode && selectedUser && 
    !assignedUsers.some(u => u.id === selectedUser.id);

  return (
    <div
      ref={isMobile ? null : drop}
      onClick={() => onTableClick(tableNumber, assignedUsers)}
      className={`
        relative bg-white rounded-lg sm:rounded-xl border border-gray-200 
        transition-all duration-200 cursor-pointer z-20
        hover:border-gray-300 hover:shadow-sm
        min-h-[160px] sm:min-h-[200px]
        ${isOver && canDrop ? "ring-2 ring-gray-400 ring-opacity-50" : ""}
        ${isOver ? "scale-[1.02]" : ""}
        ${canAssignSelectedUser ? "ring-2 ring-blue-400 ring-opacity-50 border-blue-300 bg-blue-50" : ""}
        ${isMobile && isSelectionMode && !canAssignSelectedUser ? "opacity-50" : ""}
      `}
    >
      <div className="h-full flex flex-col p-2 sm:p-3 lg:p-4">
        {/* 테이블 헤더 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
            테이블 {tableNumber}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-gray-500 font-medium">
              {assignedUsers.length}명
            </span>
            {assignedUsers.length > 0 && (
              <button
                onClick={handleSetAllToWait}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-colors"
                title="게임 종료 - 모든 사용자를 대기상태로 전환"
              >
                종료
              </button>
            )}
          </div>
        </div>

        {/* 사용자 목록 */}
        {assignedUsers.length > 0 ? (
          <div className="flex-1">
            <div className="flex flex-wrap gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-zinc-50 rounded-md sm:rounded-lg">
              {assignedUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DraggableUser
                    user={user}
                    onClick={handleUserClick}
                    isTableUser={true}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs sm:text-sm text-gray-400 font-medium">
              사용 가능
            </div>
          </div>
        )}

        {/* 드롭 오버레이 */}
        {isOver && canDrop && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-90 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-gray-600 font-medium text-xs sm:text-sm">
              여기에 배치
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
