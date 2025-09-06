import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, status } = await request.json();
    
    if (!userId || !status) {
      return NextResponse.json(
        { error: 'userId and status are required' }, 
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // s_user 테이블에서 해당 사용자 찾기 (auth.users의 ID와 email로 매칭)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // auth user의 email로 s_user 테이블에서 사용자 찾기
    const { data: sUsers, error: findError } = await supabase
      .from('s_user')
      .select('*')
      .eq('email', authUser.email);

    if (findError) {
      return NextResponse.json({ error: 'Error finding user' }, { status: 500 });
    }

    if (!sUsers || sUsers.length === 0) {
      return NextResponse.json({ error: 'User not found in s_user table' }, { status: 404 });
    }

    const sUser = sUsers[0];

    // s_user 테이블의 상태 업데이트
    const { data, error } = await supabase
      .from('s_user')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sUser.id)
      .select();

    if (error) {
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data[0],
      message: `User status updated to ${status}` 
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}