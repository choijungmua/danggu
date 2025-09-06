import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Supabase에서 로그아웃
    await supabase.auth.signOut();

    // HttpOnly 쿠키들을 제거
    const response = NextResponse.json({ message: '로그아웃 완료' });
    
    // 쿠키 제거
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    // Supabase 기본 쿠키들도 제거
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token',
    ];

    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}