# 部署

生产网站是部署到 GitHub Pages 的 Astro 静态构建。Supabase 提供无密码登录、
私有投稿记录、审核状态、私有媒体存储，以及供 Museum Agent 使用的服务端
DeepSeek 网关。

## GitHub Pages

1. 在仓库设置中，将 Pages 发布源设置为 **GitHub Actions**。
2. 在 **Settings > Secrets and variables > Actions > Variables** 中添加以下
   仓库变量：
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. 合并到 `main`，或手动运行 **Deploy GitHub Pages** 工作流。
4. 确认部署任务开始前，工作流中的 `npm run check` 已通过。

这些值只用于标识公开的 Supabase API，按设计会被嵌入浏览器构建。绝不能将
Supabase secret/service-role key、数据库密码或模型 API Key 添加到仓库变量，
也不能放入任何 `PUBLIC_` 变量。

## DeepSeek 密钥

在 Supabase Dashboard 中打开 **Edge Functions > Secrets**，添加：

- `DEEPSEEK_API_KEY`：仅供服务端使用的 DeepSeek API Key；
- `AGENT_DAILY_MODEL_LIMIT`：可选的每日整数上限，默认值为 `500`。

已部署的 `museum-agent` 函数会在请求时读取密钥，因此添加或轮换 DeepSeek
Key 后无需重新构建静态网站。不要把该 Key 写入仓库 `.env`、GitHub 或前端
代码。

设置密钥后，在首页向 Agent 提问，确认状态从 `DeepSeek 正在...` 变为
`模型已核验：deepseek-v4-flash`。这表示服务端请求模型与 DeepSeek 响应中的
实际模型回执一致。回答必须以右侧展示的证据链接为依据。密钥缺失、请求
被限流或 DeepSeek 不可用时，页面应保留确定性的本地档案答案。

## Supabase 认证 URL

在 **Authentication > URL Configuration** 中设置：

- Site URL：`https://code-2-art.github.io/code2art_museum/`
- Redirect URL：`https://code-2-art.github.io/code2art_museum/contribute/`
- Redirect URL：`https://code-2-art.github.io/code2art_museum/curator/`
- 本地重定向：`http://127.0.0.1:4321/contribute/`
- 本地重定向：`http://127.0.0.1:4321/curator/`

必须使用准确的生产路径。客户端会将当前页面作为 `emailRedirectTo` 发送，
因此投稿页和策展审核页的路径都必须加入允许列表。

## 策展人权限

1. 先让策展人申请并完成一次邮件登录。
2. 通过可信的 Auth Admin 操作设置 `app_metadata.role = curator`。
3. 让策展人退出后重新登录，使新的签名 JWT 声明进入当前会话。
4. 确认 `/curator/` 会向策展人显示审核队列，同时仍拒绝普通投稿者访问。

绝不能根据 `user_metadata` 授权，因为用户可以自行修改该字段。

## 发布检查

合并前在本地运行：

```powershell
npm ci
npm run check
```

部署后验证：

- 首页、档案、参与、策展审核、隐私页和至少一个展品详情页；
- 390 px 宽度下移动端导航没有横向溢出；
- 邮件链接能返回发起登录的页面；
- Museum Agent 能生成 DeepSeek 导览，并在函数不可用时退回本地答案；
- 投稿者可以创建草稿、上传私有文件并提交；
- 策展人可以打开签名附件，并请求修改或批准投稿；
- 匿名 REST 读取和审核 RPC 调用仍然未获授权；
- 浏览器控制台没有错误，构建产物中没有 DeepSeek 或 service-role Key。

## 回滚

GitHub Pages 的部署产物不可变。可以在 Actions 页面重新运行最后一个已知正常
的提交，也可以还原故障提交并将还原合并到 `main`。数据库结构变更必须通过
新的前向迁移修复；不要编辑或删除已经应用到生产环境的迁移。

---

# Deployment (English)

The production site is a static Astro build deployed to GitHub Pages. Supabase
provides passwordless sign-in, private submission records, review state, and
private media storage, plus a server-side DeepSeek gateway for Museum Agent.

## GitHub Pages

1. In repository settings, select **GitHub Actions** as the Pages source.
2. Add these repository variables under **Settings > Secrets and variables >
   Actions > Variables**:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Merge to `main`, or run **Deploy GitHub Pages** manually.
4. Confirm the workflow passes `npm run check` before the deploy job starts.

These values identify the public Supabase API and are embedded in the browser
bundle by design. Never add a Supabase secret/service-role key, database
password, or model API key to repository variables or any `PUBLIC_` variable.

## DeepSeek Secret

In the Supabase Dashboard, open **Edge Functions > Secrets** and add:

- `DEEPSEEK_API_KEY`: the server-only DeepSeek API key;
- `AGENT_DAILY_MODEL_LIMIT`: optional whole-number daily ceiling, default `500`.

The deployed `museum-agent` function reads the secret at request time, so adding
or rotating the DeepSeek key does not require rebuilding the static site. Do not
add this key to the repository `.env`, GitHub, or frontend code.

After setting the secret, ask the homepage Agent a question and confirm its
status changes from `DeepSeek 正在...` to `模型已核验：deepseek-v4-flash`.
This means the requested model matches the model receipt returned by DeepSeek. The response must
remain grounded in the evidence links displayed beside it. If the secret is
missing, the request is rate-limited, or DeepSeek is unavailable, the page keeps
the deterministic local archive answer.

## Supabase Auth URLs

In **Authentication > URL Configuration** set:

- Site URL: `https://code-2-art.github.io/code2art_museum/`
- Redirect URL: `https://code-2-art.github.io/code2art_museum/contribute/`
- Redirect URL: `https://code-2-art.github.io/code2art_museum/curator/`
- Local redirect: `http://127.0.0.1:4321/contribute/`
- Local redirect: `http://127.0.0.1:4321/curator/`

Use exact production paths. The client sends the current page as
`emailRedirectTo`, so both contribution and curator paths must be allowed.

## Curator Access

1. Have the curator request and complete one email sign-in first.
2. Assign `app_metadata.role = curator` through a trusted Auth Admin operation.
3. Have the curator sign out and sign in again so the new signed JWT claim is
   present in the session.
4. Confirm `/curator/` displays the review queue while an ordinary contributor
   remains denied.

Never authorize from `user_metadata`; users can edit it themselves.

## Release Check

Run locally before merging:

```powershell
npm ci
npm run check
```

After deployment verify:

- homepage, archive, contribution, curator, privacy, and one exhibit detail;
- mobile navigation at 390 px without horizontal overflow;
- email link returns to the originating page;
- Museum Agent produces a DeepSeek guide and falls back locally when its
  function is unavailable;
- contributor can create a draft, upload a private file, and submit it;
- curator can open a signed attachment and request changes or approve;
- anonymous REST reads and review RPC calls remain unauthorized;
- no browser console errors and no DeepSeek/service-role key in built assets.

## Rollback

GitHub Pages deployments are immutable artifacts. Re-run the last known-good
commit from the Actions page or revert the faulty commit and merge the revert to
`main`. Database schema changes require a new forward migration; do not edit or
delete migrations already applied to production.
