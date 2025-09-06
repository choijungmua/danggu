import { useDrop, useDrag } from "react-dnd";
import { useState, useEffect } from "react";
import { Play, Square, UserCheck, Clock, Users } from "lucide-react";
import DraggableUser from "./DraggableUser";
import dayjs from "dayjs";
import { useTable, useEndGame, useUpdateTablePlayers } from "@/hooks/useTable";
import { useUpdateSUser } from "@/hooks/useUser";

// 대기열 유저 이름 컴포넌트 (드래그 가능)
function WaitlistUserName({ user, index, onRemove, isMobile }) {
  const [{ isDragging }, drag] = useDrag({
    type: "USER",
    item: () => ({ user }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isMobile,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (dropResult && dropResult.dropped) {
        return;
      }
      if (!monitor.didDrop()) {
        setTimeout(() => {
          onRemove();
        }, 100);
      }
    },
  });

  return (
    <span
      ref={isMobile ? null : drag}
      onClick={onRemove}
      className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 m-0.5 rounded text-xs font-medium shadow-sm border cursor-pointer transition-all truncate max-w-full ${
        index === 0 
          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
          : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
      } ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-105 hover:shadow-md'}`}
      style={{ cursor: isMobile ? 'pointer' : (isDragging ? 'grabbing' : 'grab') }}
      title={`${user.name} (드래그하여 이동 또는 클릭하여 제거)`}
    >
      {user.name}
    </span>
  );
}

export default function DroppableTable({
  tableNumber,
  assignedUsers = [],
  waitlistUsers = [],
  onUserDrop,
  onTableClick,
  onRemoveUser,
  onSetAllUsersToWait,
  onAddToWaitlist,
  onProcessWaitlist,
  onStartGame,
  isMobile = false,
  isSelectionMode = false,
  selectedUser = null,
}) {
  // 테이블 상태 조회
  const { data: tableData, isLoading: tableLoading } = useTable(tableNumber);
  const endGameMutation = useEndGame();
  const updateTablePlayersMutation = useUpdateTablePlayers();
  const updateUserMutation = useUpdateSUser();
  // react-dnd droppable (모바일에서는 비활성화)
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "USER",
    drop: (item, monitor) => {
      if (!isMobile && !monitor.didDrop()) {
        const user = item.user;
        const isAlreadyInThisTable = assignedUsers.some(u => u.id === user.id);
        
        // 이미 이 테이블에 있는 사용자면 무시
        if (isAlreadyInThisTable) {
          return { dropped: false };
        }
        
        // 게임이 진행 중인 경우 대기열에 추가 (최대 6명까지만)
        if (isGameInProgress && waitlistUsers.length < 6) {
          onAddToWaitlist(tableNumber, user);
        }
        // 대기열이 가득 찬 경우
        else if (isGameInProgress && waitlistUsers.length >= 6) {
          return { dropped: false };
        } 
        // 게임이 진행 중이지 않고 테이블에 자리가 있는 경우 직접 배치
        else if (!isTableFull) {
          onUserDrop(tableNumber, user);
        }
        // 게임이 진행 중이지 않고 테이블이 가득 찬 경우 드롭 불가
        else {
          return { dropped: false };
        }
        
        return { dropped: true };
      }
    },
    canDrop: (item) => {
      if (isMobile) return false;
      const user = item.user;
      const isAlreadyInThisTable = assignedUsers.some(u => u.id === user.id);
      
      // 이미 이 테이블에 있으면 드롭 불가
      if (isAlreadyInThisTable) return false;
      
      // 게임이 진행 중이면 대기열에 추가 가능 (최대 6명까지만)
      if (isGameInProgress) return waitlistUsers.length < 6;
      
      // 게임이 진행 중이지 않으면 테이블에 자리가 있을 때만 드롭 가능
      return !isTableFull;
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
      handleEndGame(e);
    }
  };

  // 모바일에서 선택 모드일 때 선택된 사용자가 이 테이블에 할당 가능한지 확인
  const canAssignSelectedUser = isMobile && isSelectionMode && selectedUser && 
    !assignedUsers.some(u => u.id === selectedUser.id);

  // 게임 상태 확인 - s_table 데이터와 사용자 상태 모두 고려
  const playingUsers = assignedUsers.filter(user => user.status === `playing_${tableNumber}`);
  const readyUsers = assignedUsers.filter(user => user.status === `g_${tableNumber}`);
  const isGameInProgress = tableData?.status === 'playing' || playingUsers.length > 0;
  const isReadyToPlay = readyUsers.length >= 2 && !isGameInProgress;
  const isTableFull = assignedUsers.length >= 6; // 최대 6명으로 설정
  
  // 게임 중 + 준비된 모든 사용자
  const allTableUsers = [...playingUsers, ...readyUsers];
  
  // 게임 시간 추적 - s_table의 game_started_at 사용
  const [gameTime, setGameTime] = useState("00:00");
  const gameStartedAt = tableData?.game_started_at;
  
  useEffect(() => {
    if (!isGameInProgress || !gameStartedAt) {
      setGameTime("00:00");
      return;
    }
    
    const updateTimer = () => {
      const now = dayjs();
      const startTime = dayjs(gameStartedAt);
      const diff = now.diff(startTime, 'second');
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setGameTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [isGameInProgress, gameStartedAt]);
  
  // 테이블 플레이어 업데이트
  useEffect(() => {
    const currentPlayerIds = assignedUsers.map(user => user.id.toString());
    const waitingPlayerIds = waitlistUsers.map(user => user.id.toString());
    
    if (tableData && 
        (JSON.stringify(tableData.current_players) !== JSON.stringify(currentPlayerIds) ||
         JSON.stringify(tableData.waiting_players) !== JSON.stringify(waitingPlayerIds))) {
      updateTablePlayersMutation.mutate({
        tableNumber,
        currentPlayers: currentPlayerIds,
        waitingPlayers: waitingPlayerIds
      });
    }
  }, [assignedUsers, waitlistUsers, tableData, tableNumber]);
  
  // 게임 시작 함수 - page.js의 handleStartGame 호출
  const handleStartGame = async (e) => {
    e.stopPropagation();
    if (readyUsers.length >= 2 && onStartGame) {
      await onStartGame(tableNumber, readyUsers);
    }
  };
  
  // 게임 종료 함수
  const handleEndGame = async (e) => {
    e.stopPropagation();
    try {
      // 1단계: 현재 테이블의 모든 사용자 식별 (게임중 + 준비중)
      const usersToEndGame = assignedUsers.filter(user => 
        user.status === `playing_${tableNumber}` || user.status === `g_${tableNumber}`
      );
      
      // 2단계: 게임중인 사용자들을 wait 상태로 변경
      const updatePlayingUserPromises = usersToEndGame.map(user => 
        updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            status: "wait",
            updated_at: new Date().toISOString(), // 대기 시간 리셋
            online_at: new Date().toISOString(), // 대기 시간 0분으로 리셋
          },
        })
      );
      
      // 3단계: 대기열 사용자들을 테이블로 이동 (table_wait_1 -> g_1)
      const waitlistUpdatePromises = waitlistUsers.map(user => 
        updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            status: `g_${tableNumber}`,  // 대기열 -> 게임 준비 상태로 변경
            updated_at: new Date().toISOString(),
          },
        })
      );
      
      // 4단계: 모든 업데이트를 동시에 처리
      await Promise.all([...updatePlayingUserPromises, ...waitlistUpdatePromises]);
      
      // 5단계: s_table 상태 업데이트
      await endGameMutation.mutateAsync(tableNumber);
      
    } catch (error) {
      console.error('게임 종료 처리 중 오류:', error);
    }
  };

  return (
    <div
      ref={isMobile ? null : drop}
      onClick={() => onTableClick(tableNumber, assignedUsers)}
      className={`
        relative bg-white rounded-lg sm:rounded-xl border border-gray-200 
        transition-all duration-200 cursor-pointer z-20 h-full
        hover:border-gray-300 hover:shadow-sm
        ${isOver && canDrop ? "ring-2 ring-gray-400 ring-opacity-50" : ""}
        ${isOver ? "scale-[1.02]" : ""}
        ${canAssignSelectedUser ? "ring-2 ring-blue-400 ring-opacity-50 border-blue-300 bg-blue-50" : ""}
        ${isMobile && isSelectionMode && !canAssignSelectedUser ? "opacity-50" : ""}
      `}
    >
      {/* 상단 표시 영역 */}
      <div className="absolute -top-3 left-3 right-3 z-50 flex justify-between">
        {/* 테이블 제목 (좌측) */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded-md shadow-lg">
          <span className="text-xs font-medium">테이블 {tableNumber}</span>
        </div>
        {/* 게임 시간 (우측) */}
        {isGameInProgress && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-md shadow-lg border border-green-600">
            <Clock size={12} />
            <span className="text-xs font-medium">{gameTime}</span>
          </div>
        )}
      </div>
      
      <div className="h-full flex flex-col p-2 sm:p-3 md:p-4 lg:p-5 pt-3 sm:pt-4 overflow-hidden">
        {/* 플레이어 상태 표시 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">

        </div>

        <div className="flex-1 flex flex-col space-y-1 sm:space-y-2 overflow-hidden">
          {/* 게임 준비 버튼 - 중앙에 크게 표시 */}
          {!isGameInProgress && isReadyToPlay && (
            <div className="flex justify-center py-2 sm:py-3">
              <button
                onClick={handleStartGame}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md text-xs sm:text-sm"
                title="게임 시작"
              >
                <Play size={12} className="sm:w-4 sm:h-4" />
                게임 시작 ({readyUsers.length}명)
              </button>
            </div>
          )}
          
          {/* 현재 플레이어 */}
          {assignedUsers.length > 0 ? (
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-1 sm:gap-2 p-2 sm:p-3 bg-zinc-50 rounded-md sm:rounded-lg h-full overflow-y-auto scrollbar-hide min-h-[100px] sm:min-h-[120px]">
                {assignedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-start justify-center pt-1 sm:pt-1.5 w-full min-h-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-full min-w-0">
                      <DraggableUser
                        user={user}
                        onClick={user.status === `playing_${tableNumber}` ? () => {} : handleUserClick}
                        isTableUser={true}
                        sessionGameCount={user.session_game_count || 0}
                        showGameCount={true}
                        isDraggable={user.status !== `playing_${tableNumber}`} // 게임 중이면 드래그 불가
                        className={`${
                          user.status === `playing_${tableNumber}` 
                            ? 'bg-green-100 text-green-700 border border-green-200 font-semibold cursor-default' 
                            : user.status === `g_${tableNumber}`
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : ''
                        } text-xs sm:text-sm w-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-3 sm:py-4">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-400 font-medium">
                  사용 가능
                </div>
              </div>
            </div>
          )}
          
          {/* 테이블 대기열 - 게임 중일 때만 표시 */}
          {isGameInProgress && waitlistUsers.length > 0 && (
            <div className="border-t border-gray-200 pt-1 sm:pt-2 flex-shrink-0">
              {/* 대기자 이름만 표시 - 드래그 가능 */}
              <div className="overflow-y-auto scrollbar-hide">
                <div className="text-xs leading-tight space-y-0.5 sm:space-y-1">
                  {waitlistUsers.slice(0, 6).map((user, index) => (
                    <WaitlistUserName
                      key={user.id}
                      user={user}
                      index={index}
                      onRemove={() => onRemoveUser(tableNumber, user.id)}
                      isMobile={isMobile}
                    />
                  ))}
                  {waitlistUsers.length > 6 && (
                    <div className="text-xs text-gray-500 text-center py-0.5 sm:py-1">
                      +{waitlistUsers.length - 6}명 더
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 게임 종료 버튼 - 게임 중일 때 */}
          {isGameInProgress && playingUsers.length > 0 && (
            <div className="flex justify-center pt-1 sm:pt-2 flex-shrink-0">
              <button
                onClick={handleEndGame}
                className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
                title="게임 종료"
              >
                종료
              </button>
            </div>
          )}
        </div>

        {/* 드롭 오버레이 */}
        {isOver && (
          <div className={`absolute inset-0 bg-opacity-90 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed ${
            !canDrop
              ? 'bg-red-50 border-red-300'
              : isGameInProgress 
              ? 'bg-orange-50 border-orange-300' 
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className={`font-medium text-xs sm:text-sm ${
              !canDrop
                ? 'text-red-600'
                : isGameInProgress 
                ? 'text-orange-600' 
                : 'text-gray-600'
            }`}>
              {!canDrop 
                ? (isGameInProgress ? '대기열 만석 (6/6)' : '테이블 만석')
                : isGameInProgress 
                ? `대기열에 추가 (${waitlistUsers.length}/6)` 
                : '여기에 배치'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
