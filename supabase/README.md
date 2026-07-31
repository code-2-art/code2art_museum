# Supabase 后端

主站仍然使用 Astro 静态构建。Supabase 提供身份认证、私有投稿记录、审核状态、
私有上传存储，以及供 Museum Agent 使用的服务端模型网关。

## 应用数据库结构

1. 创建或连接一个 Supabase 项目。
2. 使用 Supabase CLI 或迁移 API，按文件名顺序应用 `migrations/` 中的全部
   文件。
3. 按照 `.env.example` 中的变量名，将项目 URL 和 publishable key 写入
   `.env`。
4. 将已部署网站的 URL 加入 Supabase Auth 重定向允许列表。
5. 通过可信的 Auth Admin API 设置 `app_metadata.role = curator`，以此分配
   策展人角色。绝不能使用用户可编辑的 metadata 作为角色依据。

迁移会创建私有的 `submission-media` bucket。客户端上传路径采用
`<user-id>/<submission-id>/<unique-file-name>`，并受 RLS 限制。本仓库和
浏览器构建中都不能出现 service-role key 或其他 secret key。

## Museum Agent / DeepSeek

首页首先在浏览器中执行确定性的档案检索，然后只将访客问题和相关度最高的四条
公开证据记录发送给 `museum-agent` Edge Function。该函数以非思考模式调用
`deepseek-v4-flash`，返回一段以证据为边界的简短导览。函数或模型不可用时，
本地档案答案会继续显示。

在 Supabase Dashboard 的 **Edge Functions > Secrets** 中添加
`DEEPSEEK_API_KEY`。这是仅供服务端使用的密钥：不要将它放进 `.env`、
GitHub Actions、Astro `PUBLIC_` 变量或客户端代码。添加密钥后不需要重新部署
函数。

由于网站使用不属于 JWT 的现代 `sb_publishable_...` Key，函数部署时关闭了
平台 JWT 验证。函数会自行将 `apikey` 请求头与
`SUPABASE_PUBLISHABLE_KEYS` 做常量时间校验，同时实施精确来源 CORS、有限
JSON 解析、按客户端限流和每日模型调用预算。限流和回答缓存使用的数据库表均已
启用 RLS，且未向浏览器角色授予访问权限。

默认限制：

- 每个客户端指纹每 60 秒最多请求 Agent 8 次；
- 全站每天最多发起 500 次未命中的模型调用；
- 相同问题和证据的回答缓存 24 小时。

可以设置可选的 Edge Function secret `AGENT_DAILY_MODEL_LIMIT`，调整每日模型
调用上限。缓存命中仍计入短时请求限制，但不会消耗每日 DeepSeek 预算。

后续迁移会合并 RLS 查询计划并强化输入约束。输入强化迁移会先把旧数据中的裸域名
来源链接转换为 `https://`，再实施仅允许 HTTP(S) 链接的约束；同时把宽泛的表
插入权限替换为明确的投稿者可写列。

`review_submission` 有意使用 `SECURITY DEFINER`。直接更新表不会暴露审核专用
列；该函数会验证已签名的 `app_metadata.role = curator` 声明，固定
`search_path`，校验状态转换，并以原子方式写入审核日志。

因此 Supabase Security Advisor 会将这个可调用的 definer 函数报告为预期警告。
匿名 REST 读取和审核 RPC 调用必须返回 `401`；每次部署配置 Auth URL 和策展人
metadata 后，都应验证已认证所有者与策展人的完整流程。

Agent 限流函数同样使用 `SECURITY DEFINER`，但已撤销 `public`、`anon` 和
`authenticated` 的执行权限，只授予 `service_role`。Advisor 关于两个 Agent
表“启用 RLS 但没有 policy”的提示是预期行为：它们是后端专用表，浏览器权限已经
撤销。

---

# Supabase backend (English)

The main site remains a static Astro build. Supabase provides authentication,
private submission records, review state, private upload storage, and the
server-side Museum Agent model gateway.

## Apply the schema

1. Create or connect a Supabase project.
2. Apply all files in `migrations/` in filename order with the Supabase CLI or
   migration API.
3. Add the project URL and publishable key to `.env` using the names in
   `.env.example`.
4. Add the deployed site URL to the Supabase Auth redirect allow list.
5. Assign curators with the trusted Auth Admin API by setting
   `app_metadata.role` to `curator`. Never use user-editable metadata for roles.

The migration creates a private `submission-media` bucket. Client uploads use
`<user-id>/<submission-id>/<unique-file-name>` paths and are restricted by RLS.
No service-role or secret key belongs in this repository or browser bundle.

## Museum Agent / DeepSeek

The homepage first runs deterministic archive search in the browser, then sends
only the visitor's question and the top four public evidence records to the
`museum-agent` Edge Function. The function calls `deepseek-v4-flash` in
non-thinking mode and returns a short evidence-bounded guide. If the function or
model is unavailable, the local archive answer remains visible.

Add `DEEPSEEK_API_KEY` under **Edge Functions > Secrets** in the Supabase
Dashboard. This is a server-only secret: do not put it in `.env`, GitHub Actions,
an Astro `PUBLIC_` variable, or client code. No redeploy is required after the
secret is added.

The function is deployed with platform JWT verification disabled because the
site uses a modern `sb_publishable_...` key, which is not a JWT. The function
implements its own constant-time `apikey` header validation against
`SUPABASE_PUBLISHABLE_KEYS`, exact browser-origin CORS, bounded JSON parsing,
per-client rate limiting, and a daily model-call budget. The database tables
used for rate limits and response caching have RLS enabled and grant no browser
role access.

Defaults:

- 8 Agent requests per client fingerprint per 60 seconds;
- 500 uncached model calls per day across the site;
- 24-hour response cache for identical questions and evidence.

Set the optional Edge Function secret `AGENT_DAILY_MODEL_LIMIT` to adjust the
daily model-call ceiling. Cache hits still count against the short request limit
but do not consume the daily DeepSeek budget.

Later migrations consolidate RLS query plans and harden input constraints. The
input migration also converts legacy bare-domain source links to `https://`
before enforcing HTTP(S)-only links, and replaces broad table insert privileges
with explicit contributor-writable columns.

`review_submission` intentionally uses `SECURITY DEFINER`. Direct table updates
do not expose review-only columns, while the function verifies the signed
`app_metadata.role = curator` claim, fixes `search_path`, validates state
transitions, and writes the review log atomically.

The Supabase security advisor therefore reports that callable definer function
as an intentional warning. Anonymous REST reads and review RPC calls must return
`401`; authenticated owner and curator flows should be verified after Auth URLs
and curator role metadata are configured for each deployment.

The Agent rate-limit function is also `SECURITY DEFINER`, but execution is
revoked from `public`, `anon`, and `authenticated` and granted only to
`service_role`. Advisor notices that the two Agent tables have RLS without
policies are intentional: they are backend-only tables with browser privileges
revoked.
