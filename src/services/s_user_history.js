import { supabase } from '@/lib/supabase';
import { getKoreanISOString, debugTimeInfo } from '@/utils/timezoneUtils';

// 사용자 액션 로깅 - 단순화된 구현 (카운트는 별도 관리)
export async function logUserAction(userId, action, previousStatus = null, newStatus = null, tableNumber = null, metadata = null) {

  try {
    
    // 세션 시작 시간 찾기 (한국 시간 기준)
    let sessionStartTime = getKoreanISOString();
    
    if (action === 'online' || action === 'login') {
      // 온라인/로그인 액션이면 새로운 세션 시작
      sessionStartTime = getKoreanISOString();
    } else {
      // 기존 세션 찾기
      const { data: lastSession } = await supabase
        .from('user_history')
        .select('session_start_time')
        .eq('user_id', userId)
        .in('action', ['online', 'login'])
        .not('session_start_time', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastSession && lastSession.length > 0) {
        sessionStartTime = lastSession[0].session_start_time;
      }
    }

    // 히스토리 레코드 삽입 (게임 카운트는 별도 관리)
    const { data: insertedRecord, error: insertError } = await supabase
      .from('user_history')
      .insert([
        {
          user_id: userId,
          action: action,
          previous_status: previousStatus,
          new_status: newStatus,
          table_number: tableNumber,
          session_start_time: sessionStartTime,
          game_count_session: 0, // 게임 카운트는 s_user.session_game_count에서 관리
          game_count_total: 0, // 히스토리에서는 0으로 기록
          metadata: metadata,
          created_at: getKoreanISOString()
        }
      ])
      .select();

    if (insertError) {
      
      throw new Error(`Failed to log user action: ${insertError.message}`);
    }

    
    return insertedRecord?.[0]?.id || null;
  } catch (error) {
    throw error;
  }
}

// 사용자의 현재 세션 게임 횟수 조회 - 단순화된 안정적 구현
export async function getUserSessionGameCount(userId) {
  
  try {
    // 1. 모든 게임 시작 히스토리 조회 (최신 세션부터)
    const { data: gameHistory, error } = await supabase
      .from('user_history')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'game_start')
      .not('session_start_time', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50); // 최신 50개만

    if (error) {
      return 0;
    }

    if (!gameHistory || gameHistory.length === 0) {
      return 0;
    }

    // 2. 가장 최근의 세션 시작 시간 찾기
    const latestSession = gameHistory[0].session_start_time;

    // 3. 해당 세션의 게임 시작 횟수 카운트
    const sessionGameCount = gameHistory.filter(game => 
      game.session_start_time === latestSession
    ).length;

    return sessionGameCount;
  } catch (error) {
    return 0;
  }
}

// 사용자의 총 게임 횟수 조회 - 커스텀 구현
export async function getUserTotalGameCount(userId) {
  try {
    const { data, error } = await supabase
      .from('user_history')
      .select('game_count_total')
      .eq('user_id', userId)
      .not('game_count_total', 'is', null)
      .order('game_count_total', { ascending: false })
      .limit(1);

    if (error) {
      return 0;
    }

    return data && data.length > 0 ? data[0].game_count_total : 0;
  } catch (error) {
    return 0;
  }
}

// 사용자 히스토리 조회 - 커스텀 구현
export async function getUserHistory(userId = null, limit = 50, offset = 0) {
  try {
    let query = supabase
      .from('user_history')
      .select(`
        id,
        user_id,
        action,
        previous_status,
        new_status,
        table_number,
        session_start_time,
        game_count_session,
        game_count_total,
        metadata,
        created_at,
        s_user:user_id (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    // user_name 필드 추가 (RPC와 동일한 형태로 반환)
    const formattedData = data.map(record => ({
      ...record,
      user_name: record.s_user?.name || 'Unknown'
    }));

    return formattedData || [];
  } catch (error) {
    return [];
  }
}

// 직접 user_history 테이블 조회 (백업용)
export async function getUserHistoryDirect(userId = null) {
  let query = supabase
    .from('user_history')
    .select(`
      *,
      s_user:user_id (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user history: ${error.message}`);
  }

  return data || [];
}

// 간단하고 확실한 게임 카운트 관리 - s_user 테이블 기반
export async function getAllUsersSessionGameCount() {
  
  try {
    // 1. 모든 사용자 조회 (온라인 상태 관계없이)
    const { data: users, error: usersError } = await supabase
      .from('s_user')
      .select('id, name, is_online, online_count');

    if (usersError) {
      return {};
    }

    const allUsers = users || [];

    // 2. 각 사용자의 현재 세션 게임 카운트를 online_count로 임시 사용
    // (실제로는 별도의 session_game_count 필드가 필요하지만 일단 이렇게)
    const gameCountMap = {};
    
    for (const user of allUsers) {
      if (user.is_online) {
        // 온라인 사용자: 현재 세션의 실제 게임 카운트 조회
        try {
          const actualCount = await getUserSessionGameCount(user.id);
          gameCountMap[user.id] = actualCount;
        } catch (error) {
          gameCountMap[user.id] = 0;
        }
      } else {
        // 오프라인 사용자: 0
        gameCountMap[user.id] = 0;
      }
    }

    return gameCountMap;
  } catch (error) {
    return {};
  }
}

// 강제로 게임 카운트를 1 증가시키는 함수
export async function forceIncrementGameCount(userId) {
  
  try {
    // 현재 카운트 조회
    const currentCount = await getUserSessionGameCount(userId);
    
    // 새로운 카운트
    const newCount = currentCount + 1;
    
    // 강제로 게임 시작 히스토리 추가
    const now = getKoreanISOString();
    const { data, error } = await supabase
      .from('user_history')
      .insert({
        user_id: userId,
        action: 'game_start',
        previous_status: 'g_1', // 임시
        new_status: 'playing_1', // 임시  
        table_number: 1, // 임시
        session_start_time: now, // 현재 시간을 세션 시작으로
        game_count_session: newCount,
        game_count_total: newCount,
        metadata: {
          timestamp: now,
          forced_increment: true,
          reason: 'manual_game_count_fix'
        },
        created_at: now
      })
      .select();
    
    if (error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// 액션 타입 상수
export const USER_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ONLINE: 'online',
  OFFLINE: 'offline',
  ENTRANCE: 'entrance',
  WAIT: 'wait',
  OUTING: 'outing',
  TABLE_JOIN: 'table_join',
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  TABLE_WAIT: 'table_wait'
};