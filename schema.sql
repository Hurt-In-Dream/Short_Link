-- 1. 创建短链接主表
CREATE TABLE public.short_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL,
  short_code text NOT NULL,
  target_url text NOT NULL,
  password text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 添加联合唯一约束，因为不同域名可以有相同的短码
  UNIQUE (domain, short_code)
);

-- 2. 启用行级安全政策 (RLS - Row Level Security)
-- 注意：这里为了方便演示，我们允许任何人都可以 INSERT，您可以后续在 Supabase 中调整更为严格的安全策略。
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- 允许匿名端点对该表的 INSERT 操作（以便在您的前端网页上无缝生成链接）
CREATE POLICY "Enable insert for anonymous users" 
ON public.short_links FOR INSERT 
WITH CHECK (true);

-- （由于您的 CF Worker 是通过自带的 service key 或者设置 REST 接口绕过前端 RLS 来执行 SELECT，因此可以不向公共暴露 SELECT 权限，保护您的链接库安全）
-- 若要为 CF Worker 提供 SELECT，而您的 CF Worker 代码采用的是 anon key，则必须开启 Select policy。
-- 这里我们开放 Select policy，允许具有 anon key 的请求（如您的 CF Worker）读取数据。
CREATE POLICY "Enable select for anyone" 
ON public.short_links FOR SELECT 
USING (true);
