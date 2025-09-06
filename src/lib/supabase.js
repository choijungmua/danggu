import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 쿠키 기반 Supabase 클라이언트 (자동으로 쿠키에서 세션 정보를 읽어옴)
export const supabase = createClientComponentClient({
  cookieOptions: {
    name: 'supabase-auth-token',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // 클라이언트 컴포넌트에서 접근 가능하도록
    sameSite: 'lax',
    path: '/',
  }
})