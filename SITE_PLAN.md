---
type: plan
project: code2art_museum
status: active
created: 2026-06-20
updated: 2026-06-21
source: manual
tags: [site-plan, information-architecture, references]
---

# 网站方案

## 定位

`code2art museum` 应该从当前静态 MVP，逐步成长为实验编程社区的在线数字博物馆、档案馆与研究平台。

网站不只展示完成的作品。它应该把作品、开源项目、Prompt、Skill、课程、工具、成员、社区历史与 AI 原生建设过程组织成一个可以持续生长的公共文化与研究系统。

新的核心交互原则：从目录式博物馆，转向导览式博物馆。档案搜索框不只是检索入口，而是与博物馆 Agent 对话的入口。每个访问者进入博物馆时，都应该像获得一位私人导览员，可以按自己的兴趣、身份、问题和知识背景获得不同的参观路线、档案解释与参与建议。

## 参考案例

架构参考：

- ZKM：整体机构结构、媒体艺术研究框架、展览、档案、教育、可访问性、数字项目与机构叙事。

辅助参考：

- Rhizome ArtBase：数字原生作品档案、保存版本、数字作品文档方式。
- Whitney artport：线上展览入口、网络艺术委托创作、主题化网页展区。
- OpenProcessing：创意编程社区参与、成员作品、学习、分享与作品集机制。
- Ars Electronica Archive：艺术与科技历史、节展、奖项、分类体系与国际媒体艺术语境。

内容策展参考：

- CreativeApplications.Net：创意技术项目报道、案例策展、作品技术语境与创作者信息组织方式。它不作为整体网站架构主参考，但适合启发 `当前项目`、`案例研究`、`技术观察`、`精选作品报道` 等栏目。

（旧世代）3D / 沉浸式 / 元宇宙参考：

- New Art City：https://newart.city/ 。虚拟 gallery 与 digital art exhibition toolkit，适合参考线上展览如何以网页、3D 空间、作品陈述、标签和策展项目形成可持续发布的展览网络。
- VOMA / Virtual Online Museum of Art：https://www.wired.com/story/pandemic-changes-art-experience/ 。适合参考“线上原生博物馆建筑”的空间尺度、展厅组织、庭院 / 表演空间 / 无限扩展建筑等方向，而不是把 3D 仅做成作品卡片的容器。
- KUNSTMATRIX Artspaces - Naturally Kladow：https://artspaces.kunstmatrix.com/en/exhibition/15683637/naturlich-kladow 。适合参考成熟 3D 线上展厅中的白盒子展陈、作品墙、导览动线和浏览器可访问体验。
- Metasteps：https://metasteps.com/?utm_source=artsteps&utm_medium=referral&utm_campaign=introducing-metasteps 。适合参考从 Artsteps 式 3D 展览编辑器向更完整元宇宙 / 空间发布平台演化的产品方向。

## 建议导航

近期主导航：

- 首页
- 展览
- 档案
- 研究
- 成员
- 3D 展馆
- 参与

次级入口或页脚链接：

- 建设进程
- 博物馆 Agent
- 贡献者
- 项目
- 活动
- 出版物 / 文档
- CHANGE
- GitHub

当前导航 `展品 / 成员 / 贡献者 / 3D 展馆 / 参与` 应该渐进演化，而不是一次性全部替换。

## 首页结构

### 当前设计决议

当前首页方向已经确认：采用浅色国际艺术科技机构气质，以 `Museum Agent` 作为首屏的核心交互入口，而不是把首页做成传统作品卡片墙、深色科技 dashboard 或 AI SaaS 落地页。

设计重点：

- 第一视觉锚点是 `code2art museum` 的博物馆身份。
- 第一交互锚点是对话式档案搜索框，也就是 Museum Agent 的入口。
- 首页要让访问者感觉自己进入了一座有导览员的在线博物馆，而不是进入一个普通目录网站。
- 关系图谱的角色是“证据地图 / 路线地图”，用于解释 Agent 为什么推荐某些作品、项目、人物、Prompt、Skill 或历史节点；它不是为了制造科技感的装饰。
- 视觉气质参考 ZKM 与 Ars Electronica Archive 一类的机构型 archive / research platform：克制、清晰、留白充分、字体层级强、内容可被认真阅读。
- CreativeApplications.Net 的价值主要在内容策展方法：如何把创意技术项目讲清楚，而不是作为首页结构或视觉风格的主参考。

当前实现方向：

- 使用 Astro 5 + TypeScript + Tailwind 最新版作为主框架。
- 保持 `docs/` 作为 GitHub Pages 发布目录。
- 首页先完成静态 Agent 原型、档案入口、研究方向、建设进程与历史节点。
- 3D 展馆继续作为可选的空间浏览层，不抢占首页主体验。

### Hero

目标：建立博物馆身份。

建议文案：

- `code2art museum`
- `实验编程社区的在线数字博物馆`
- `收藏作品、项目、Prompt、Skill、成员、历史与 AI 协作过程。`

主按钮：

- 进入展览
- 进入 3D 展馆
- 查看建设进程

Hero 区应该优先出现一个“对话式档案搜索框”。它同时承担搜索、导览和提问入口，例如：

- `我想看和生成艺术有关的早期作品`
- `给我一条适合新手的参观路线`
- `有哪些作品用了 prompt engineering？`
- `我想了解 ContraOS 和这个博物馆的关系`
- `我想找适合参与的项目`

这个输入框不应表现为普通站内搜索，而应像博物馆导览台：用户可以直接表达意图，系统返回作品、项目、人物、Prompt、Skill、历史节点和建设过程之间的关系。

首屏视觉重点：

- 大标题 `code2art museum` 是第一视觉锚点。
- Museum Agent 输入框是第一交互锚点。
- 关系图谱只作为 Agent 回答旁边的证据地图 / 参观路线图，不作为科技感装饰。
- 下方栏目只露出当前展览、档案入口、建设进程等低调预览，避免抢走首屏焦点。
- 首屏应该更像国际艺术科技机构的 archive / research homepage，而不是 SaaS dashboard 或营销落地页。

### 当前展览

用于突出当前重点主题：

- 最小可见博物馆
- AI Native Building Process
- HUDOIT 与实验编程源流

### 当前项目 / 案例研究

借鉴 CreativeApplications.Net 的项目报道方式，用于呈现 code2art 社区中的创意技术案例：

- 项目是什么
- 使用了什么技术
- 创作者是谁
- 创作过程 / 研究问题
- 现场或交互方式
- 代码 / 工具 / 链接
- 为什么值得被收录

### 档案入口

档案分类：

- 作品
- 开源项目
- Prompt / Skill
- 课程与案例
- 历史节点
- 媒体资料

### 博物馆 Agent / 导览式搜索

这是网站区别于普通 archive 的关键体验。

定位：

- `搜索框 = 博物馆 Agent 入口`
- `搜索结果 = 个性化导览路线 + 档案卡片 + 关系解释`
- `档案浏览 = 可被对话重新组织的知识空间`

Agent 的核心能力：

- 理解用户意图，而不是只做关键词匹配。
- 把作品、项目、成员、Prompt、Skill、课程、历史节点和建设记录串联起来。
- 为不同用户生成不同路线：新访客、创作者、研究者、贡献者、策展人、开发者。
- 在“搜索结果”和“导览对话”之间自由切换。
- 解释为什么某个作品、项目或人物值得被看见。
- 根据用户目标推荐参与方式，例如提交作品、补充历史、贡献 Prompt / Skill、参与测试或协助开发。

典型交互模式：

- `找资料`：用户提出主题，Agent 返回相关档案和可继续追问的问题。
- `看路线`：用户说明兴趣和时间，Agent 生成一条 5 分钟、15 分钟或深度研究路线。
- `问关系`：用户询问某个作品、项目、人物或技术之间的关联。
- `要参与`：用户说明自己的能力和兴趣，Agent 推荐合适的参与入口。
- `进入 3D`：Agent 可以把用户带到对应展厅或展品节点。

界面形态：

- 首页 Hero 使用大型输入框作为第一入口。
- 档案页保留筛选器，但顶部仍以 Agent 输入框作为主要入口。
- 搜索结果页同时显示“导览回答”“相关档案”“关系节点”“下一步问题”。
- 3D 展馆中可以出现轻量导览面板，而不是把对话框做成独立客服组件。
- 关系节点图应服务于“为什么推荐 / 从哪里来 / 可以去哪里”，视觉上克制、轻量、可解释。

### 研究方向

研究主题：

- AI 原生创作
- Creative Coding
- Human on the Loop
- Prompt / Context / Harness / Loop Engineering
- 社区档案方法

### 建设进程

保留首页纵向时间轴，把它作为正式公共栏目：

- 当前版本
- 已完成模块
- 正在建设
- 下一阶段

增量记录的事实来源仍然是 `repo/CHANGE.md`。

### 成员与贡献者

从简单的贡献者墙扩展为：

- 成员 Profile
- 建设者
- 研究者
- 艺术家
- 开发者
- 未来贡献者

### 参与方式

参与路径：

- 提交作品
- 补充历史
- 完善 Profile
- 贡献 Prompt / Skill
- 参与测试
- 贡献代码
- 参与策展

## 建议页面

- `/`：首页
- `/exhibitions/`：展览与策展主题
- `/archive/`：档案总览
- `/archive/works/`：作品档案
- `/archive/projects/`：开源项目档案
- `/archive/prompts-skills/`：Prompt / Skill 档案
- `/research/`：研究方向
- `/members/`：成员 Profile
- `/space/`：3D 展馆
- `/progress/`：来自 `CHANGE.md` 的建设进程
- `/contribute/`：参与方式

当前页面映射：

- `docs/exhibits/` -> `/archive/works/` 或 `/exhibitions/`
- `docs/profiles/` -> `/members/`
- `docs/contributors/` -> `/contribute/` 或 `/members/builders/`
- `docs/space/` -> `/space/`
- `CHANGE.md` -> `/progress/`

## 内容模型

未来档案对象类型：

- `work`：艺术作品或创意编程作品
- `project`：开源项目
- `person`：成员 Profile
- `prompt`：Prompt 资产
- `skill`：可复用 Skill 或工作流
- `course`：课程或学习案例
- `event`：活动、工作坊或展览节点
- `history`：社区历史节点
- `process`：建设过程记录
- `publication`：文档、文章或研究笔记

建议共用字段：

- 标题
- 类型
- 时间
- 作者 / 贡献者
- 简介
- 详细描述
- 媒体
- 链接
- 许可证
- 状态：`draft`、`needs-review`、`published`
- 关联人物
- 关联项目
- 关联历史节点

为了支持 Museum Agent，未来内容模型还应增加可检索与可解释字段：

- 主题标签
- 关键词
- 适合人群：新访客、创作者、研究者、贡献者、策展人、开发者
- 推荐参观时长
- 关联问题
- 可被 Agent 引用的摘要
- 关系描述：它与哪些作品、项目、人物、Prompt、Skill 或历史节点有关

## 技术方向

当前技术基线：

- 主框架：Astro 5。
- 类型系统：TypeScript。
- 样式系统：Tailwind 最新版。
- 构建输出：`docs/`，继续作为 GitHub Pages 发布目录。
- 开发源码：`repo/src/`。
- 静态资产：`repo/public/`。
- 3D 展馆：保留现有 Three.js 空间浏览层，并从 Astro 构建中复制到 `docs/space/`。

当前阶段目标：

- 用 Astro 建立稳定页面结构、布局组件、导航数据和内容数据。
- 用 Tailwind 主题令牌沉淀视觉系统，避免未来多人和多 AI 工具协作造成风格割裂。
- 先做“对话式搜索入口”的前端原型，用静态示例数据模拟 Agent 回答。
- 保持 `CHANGE.md` 作为建设进程的事实来源，并在首页公开呈现。

未来扩展方向：

- 内容组织：优先使用 Astro Content Collections 管理作品、项目、成员、Prompt、Skill、历史节点、建设进程等内容。
- 3D 展馆：继续使用 Three.js，作为独立的空间浏览层嵌入 Astro 站点。
- Museum Agent：作为独立服务或 API 层接入，前端只负责对话体验、检索结果展示和路线呈现。

Museum Agent 分阶段技术路线：

- 第一阶段：静态交互原型。首页和档案页展示对话式搜索入口，使用固定示例回答验证体验。
- 第二阶段：结构化检索。把 `CHANGE.md`、作品档案、成员资料、项目文档、Prompt / Skill 等内容整理为可索引数据。
- 第三阶段：RAG / embedding。基于档案内容、元数据和关系字段，提供真实问答、推荐和个性化路线。
- 第四阶段：空间导览。Agent 可以与 3D 展馆联动，带用户进入对应展厅、作品或历史节点。

技术取舍：

- Astro 适合内容驱动的网站、档案、文档、社区站点和静态发布。
- TypeScript 适合约束内容模型、导航数据、档案条目和页面组件。
- Tailwind 最新版适合建立可维护的设计系统，不锁定旧版 Tailwind 3。
- Three.js 不应被 Astro 替代；它负责 3D 空间，Astro 负责页面、内容与路由。

## 视觉方向

当前确认的主方向：

- 国际化艺术科技机构气质，而不是普通开源项目主页或 AI SaaS 产品页。
- Light institutional archive：纸白、暖灰、近黑文字，克制但高级。
- 强字体层级：`code2art museum` 作为大型视觉锚点；导航、元数据、目录标签使用精确的 grotesk sans；档案编号可少量使用 monospace。
- 高审美、少装饰：用留白、网格、字体、细线和比例建立美感，而不是用大面积渐变、发光节点或装饰图形。
- Museum Agent 是首页唯一强交互重点。
- 关系图谱是证据地图 / 参观路线图，用于解释档案关系，不是为了制造科技感。
- 下方栏目使用窄条、目录、索引式预览，不堆满卡片。

建议配色：

- 背景：museum paper white / warm off-white。
- 主文字：deep near-black / charcoal。
- 辅助线条：warm gray / archive gray。
- 主强调色：vermilion red-orange，用于 Agent 输入框、主行动或当前状态。
- 次强调色：muted archive green，用于档案关系、分类状态或建设进程。
- 少量高光：soft gold，只用于重要标记或时间节点。
- 颜色比例：约 85% 中性色、10% 黑灰、5% 强调色。

避免：

- 紫蓝渐变和通用 AI 产品感。
- 大面积深色科幻 dashboard。
- 发光节点、玻璃拟态、装饰性 orb / blob。
- 过度拥挤的信息墙。
- 关系图谱抢过 Agent 输入框和标题。
- 纯营销 hero split layout。

首页应该少一点临时 landing page 的感觉，多一点国际艺术科技 archive / research platform 的感觉。

## 3D 展馆角色

3D 展馆应该成为同一套信息架构的空间浏览层。

可能的空间映射：

- 大厅：首页 / 当前展览
- 展厅一：作品
- 展厅二：项目
- 展厅三：Prompt / Skill
- 档案室：历史节点
- 研究室：研究方向
- 成员墙：Profile
- 建设现场：CHANGE / 进程

3D 展馆不应该是唯一主体验，而应该是探索博物馆的一种模式。

Museum Agent 在 3D 展馆中的角色：

- 像空间导览员，而不是聊天客服。
- 根据用户问题推荐展厅、展品或路线。
- 在用户接近作品时解释作品背景、关联项目、作者和可继续探索的节点。
- 支持从对话跳转到空间，也支持从空间中的展品反向打开档案记录。

## 路线图

### Phase 1 - 信息架构升级

- 已采用 Astro 5 + TypeScript + Tailwind 最新版重建首页源代码。
- 已将导航调整为 `展览 / 档案 / 研究 / 成员 / 建设进程 / 参与`，并保留 3D 展馆入口。
- 已保留建设进程时间轴，并以 `CHANGE.md` 为内容事实来源。
- 已在首页 Hero 增加“对话式档案搜索 / 博物馆 Agent”入口原型。
- 已增加档案入口、研究方向、建设进程、历史节点等栏目。
- 下一步补充当前项目 / 案例研究栏目，用 CreativeApplications.Net 的方式呈现创意技术项目。

### Phase 2 - 内容类型升级

- 从 exhibits 扩展到更完整的 archive 模型。
- 增加 project、prompt、skill、history、process、publication 等类型。
- 为档案条目增加适合 Agent 检索、解释和推荐的摘要、主题、关系与关联问题字段。
- 减少重复硬编码页面。
- 判断静态 HTML 是否仍然合适；如果开始框架化，采用 Astro + TypeScript + Tailwind 最新版。

### Phase 3 - Museum Agent 升级

- 将档案内容、`CHANGE.md`、成员资料、项目文档、Prompt / Skill 等整理为可检索知识源。
- 建立面向导览的问答、推荐路线和关系解释能力。
- 让搜索结果页升级为“回答 + 档案 + 路线 + 关系图”的综合页面。
- 根据用户身份和目标生成不同参观路线。

### Phase 4 - 3D 展馆升级

- 让 3D 空间反映同一套档案结构。
- 用真实展览建筑 / 资产替换程序化占位空间。
- 将 3D 分区连接到真实档案数据。
- 将 Museum Agent 接入 3D 空间导览。

## 下一步实现

近期实现顺序：

- 构建并发布当前 Astro 首页到 GitHub Pages。
- 检查线上 `docs/` 产物中的导航、链接、3D 展馆入口和移动端布局。
- 将当前项目 / 案例研究栏目加入首页，用 CreativeApplications.Net 式的项目报道结构呈现创意技术案例。
- 将 Agent 原型从静态输入框推进到可搜索的结构化档案索引。
- 继续在 `repo/CHANGE.md` 记录每次增量，让博物馆建设过程本身成为公开档案。
