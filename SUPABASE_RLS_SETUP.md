# Supabase RLS 정책 설정 가이드

이 문서는 익명 사용자가 당구장 관리 시스템의 사용자 리스트를 조회할 수 있도록 Supabase RLS(Row Level Security) 정책을 설정하는 방법을 안내합니다.

## 현재 상황

- 애플리케이션은 로그인 없이도 접근 가능하도록 수정됨
- 익명 사용자도 사용자 리스트 조회 및 관리 기능을 사용할 수 있어야 함

## 필요한 RLS 정책 변경

### 1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 해당 프로젝트 선택
3. 좌측 메뉴에서 **"Authentication"** > **"Policies"** 선택

### 2. s_user 테이블 정책 설정

#### 기존 정책 확인
현재 `s_user` 테이블에 설정된 RLS 정책을 확인합니다.

#### 새로운 정책 추가

**정책 1: 익명 사용자 SELECT 허용**
```sql
-- 정책 이름: Allow anonymous select on s_user
-- 테이블: s_user
-- 작업: SELECT
-- 대상: public (모든 사용자)

CREATE POLICY "Allow anonymous select on s_user" ON "public"."s_user"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
```

**정책 2: 익명 사용자 INSERT 허용 (사용자 추가)**
```sql
-- 정책 이름: Allow anonymous insert on s_user
-- 테이블: s_user
-- 작업: INSERT
-- 대상: public (모든 사용자)

CREATE POLICY "Allow anonymous insert on s_user" ON "public"."s_user"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);
```

**정책 3: 익명 사용자 UPDATE 허용 (사용자 정보 수정)**
```sql
-- 정책 이름: Allow anonymous update on s_user
-- 테이블: s_user
-- 작업: UPDATE
-- 대상: public (모든 사용자)

CREATE POLICY "Allow anonymous update on s_user" ON "public"."s_user"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
```

**정책 4: 익명 사용자 DELETE 허용 (사용자 삭제)**
```sql
-- 정책 이름: Allow anonymous delete on s_user
-- 테이블: s_user
-- 작업: DELETE
-- 대상: public (모든 사용자)

CREATE POLICY "Allow anonymous delete on s_user" ON "public"."s_user"
AS PERMISSIVE FOR DELETE
TO public
USING (true);
```

### 3. 대안: 모든 작업을 허용하는 단일 정책

위의 개별 정책 대신, 모든 작업을 허용하는 단일 정책을 사용할 수도 있습니다:

```sql
-- 기존 정책들 삭제 (필요한 경우)
DROP POLICY IF EXISTS "Allow anonymous select on s_user" ON "public"."s_user";
DROP POLICY IF EXISTS "Allow anonymous insert on s_user" ON "public"."s_user";
DROP POLICY IF EXISTS "Allow anonymous update on s_user" ON "public"."s_user";
DROP POLICY IF EXISTS "Allow anonymous delete on s_user" ON "public"."s_user";

-- 모든 작업을 허용하는 정책
CREATE POLICY "Allow all operations for anonymous users" ON "public"."s_user"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

### 4. RLS 활성화 확인

테이블에 RLS가 활성화되어 있는지 확인:

```sql
-- RLS 활성화 (이미 활성화되어 있을 수 있음)
ALTER TABLE "public"."s_user" ENABLE ROW LEVEL SECURITY;
```

### 5. Dashboard에서 설정하는 방법

SQL 대신 Supabase Dashboard UI를 사용하는 경우:

1. **Table Editor** > **s_user** 테이블 선택
2. **Settings** 탭 클릭
3. **Row Level Security** 섹션에서 정책 관리
4. **Add Policy** 버튼 클릭
5. 정책 설정:
   - **Policy name**: `Allow anonymous access`
   - **Allowed operation**: `All` 또는 개별 선택 (SELECT, INSERT, UPDATE, DELETE)
   - **Target roles**: `public`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`

## 보안 고려사항

⚠️ **주의**: 이 설정은 익명 사용자에게 모든 데이터 접근 권한을 부여합니다.

### 권장 보안 조치

1. **IP 제한**: 특정 IP 대역에서만 접근 가능하도록 제한
2. **시간 제한**: 특정 시간대에만 접근 가능하도록 제한
3. **데이터 제한**: 민감한 정보가 포함된 컬럼은 별도 처리

### 더 안전한 정책 예시 (선택사항)

특정 조건을 만족하는 경우에만 접근을 허용하는 정책:

```sql
-- 예시: 특정 시간대에만 접근 허용
CREATE POLICY "Allow access during business hours" ON "public"."s_user"
AS PERMISSIVE FOR SELECT
TO public
USING (
  EXTRACT(hour FROM now() AT TIME ZONE 'Asia/Seoul') BETWEEN 9 AND 21
);
```

## 테스트

정책 설정 후 다음과 같이 테스트:

1. 브라우저 시크릿 모드로 애플리케이션 접속
2. 로그인하지 않은 상태에서 사용자 리스트 로딩 확인
3. 사용자 추가/수정/삭제 기능 테스트
4. 개발자 도구 Network 탭에서 API 응답 확인

## 문제 해결

### 403 Forbidden 오류가 발생하는 경우:
- RLS 정책이 올바르게 설정되었는지 확인
- 정책의 대상이 `public`으로 설정되었는지 확인
- `USING` 조건이 `true`로 설정되었는지 확인

### 정책이 적용되지 않는 경우:
- RLS가 테이블에 활성화되어 있는지 확인
- 브라우저 캐시 클리어 후 재테스트
- Supabase 프로젝트 재시작 고려

## 추가 리소스

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 문서](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)