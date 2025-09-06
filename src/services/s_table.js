import { supabase } from '@/lib/supabase';

// 모든 테이블 조회
export async function getTables() {
  const { data, error } = await supabase
    .from('s_table')
    .select('*')
    .order('table_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tables: ${error.message}`);
  }

  return data;
}

// 특정 테이블 조회
export async function getTable(tableNumber) {
  const { data, error } = await supabase
    .from('s_table')
    .select('*')
    .eq('table_number', tableNumber)
    .single();

  if (error) {
    throw new Error(`Failed to fetch table ${tableNumber}: ${error.message}`);
  }

  return data;
}

// 테이블 업데이트
export async function updateTable(tableNumber, updates) {
  const { data, error } = await supabase
    .from('s_table')
    .update({
      ...updates,
      last_updated: new Date().toISOString(),
    })
    .eq('table_number', tableNumber)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update table ${tableNumber}: ${error.message}`);
  }

  return data;
}

// 게임 시작
export async function startGame(tableNumber, playerIds) {
  const { data, error } = await supabase
    .from('s_table')
    .update({
      status: 'playing',
      game_started_at: new Date().toISOString(),
      current_players: playerIds,
      game_duration: 0,
      last_updated: new Date().toISOString(),
    })
    .eq('table_number', tableNumber)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start game at table ${tableNumber}: ${error.message}`);
  }

  return data;
}

// 게임 종료
export async function endGame(tableNumber) {
  const { data, error } = await supabase
    .from('s_table')
    .update({
      status: 'available',
      game_started_at: null,
      game_duration: 0,
      current_players: [],
      waiting_players: [],
      last_updated: new Date().toISOString(),
    })
    .eq('table_number', tableNumber)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to end game at table ${tableNumber}: ${error.message}`);
  }

  return data;
}

// 플레이어 추가/제거
export async function updateTablePlayers(tableNumber, currentPlayers, waitingPlayers = []) {
  const status = currentPlayers.length > 0 ? 'occupied' : 'available';
  
  const { data, error } = await supabase
    .from('s_table')
    .update({
      status,
      current_players: currentPlayers,
      waiting_players: waitingPlayers,
      last_updated: new Date().toISOString(),
    })
    .eq('table_number', tableNumber)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update players at table ${tableNumber}: ${error.message}`);
  }

  return data;
}

// 게임 시간 업데이트 (실시간)
export async function updateGameDuration(tableNumber, duration) {
  const { data, error } = await supabase
    .from('s_table')
    .update({
      game_duration: duration,
      last_updated: new Date().toISOString(),
    })
    .eq('table_number', tableNumber)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update game duration at table ${tableNumber}: ${error.message}`);
  }

  return data;
}

// 모든 테이블의 게임 종료
export async function endAllGames() {
  const { data, error } = await supabase
    .from('s_table')
    .update({
      status: 'available',
      game_started_at: null,
      game_duration: 0,
      current_players: [],
      waiting_players: [],
      last_updated: new Date().toISOString(),
    })
    .neq('status', 'available') // available이 아닌 모든 테이블 (occupied, playing 등)
    .select();

  if (error) {
    throw new Error(`Failed to end all games: ${error.message}`);
  }

  return data;
}