import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 서버 컴포넌트용 Supabase 클라이언트
export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}