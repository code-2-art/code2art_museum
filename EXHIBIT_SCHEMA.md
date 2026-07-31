# Exhibit Schema

展品数据是 code2art museum 的核心契约。任何人、使用任何工具贡献展品，都应该先让内容符合统一 schema，再由网站或后续系统进行展示。

网站会在构建时通过 `src/data/schemas.ts` 校验展品、成员与历史 JSON。缺少必填字段、使用非法类型/状态、出现未知字段或重复 ID 都会让构建失败。可运行 `npm test` 检查 schema 的正向与负向用例。

## 最小数据格式

```json
{
  "id": "c2a-001",
  "title": "作品标题",
  "type": "artwork / project / prompt / skill / profile / history",
  "author": "作者",
  "year": "年份",
  "tools": ["p5.js", "TouchDesigner", "ChatGPT"],
  "description": "展品说明",
  "process": "创作过程",
  "media": ["图片", "视频", "网页链接"],
  "repo": "代码链接",
  "contributors": ["贡献者"],
  "license": "许可协议"
}
```

## 字段说明

| Field | Required | Description |
|---|---|---|
| `id` | yes | 稳定唯一 ID，建议使用 `c2a-001` 这样的短 ID。 |
| `title` | yes | 展品标题。 |
| `type` | yes | `artwork`、`project`、`prompt`、`skill`、`profile`、`history` 之一。 |
| `author` | yes | 作者、团队或社群名称。 |
| `year` | yes | 创作或发生年份；不确定时使用 `needs-review` 并在说明中标注。 |
| `tools` | no | 使用的工具、框架、模型或设备。 |
| `description` | yes | 面向观众的展品说明。 |
| `process` | no | 创作过程、方法、Prompt、协作方式或技术路线。 |
| `media` | no | 图片、视频、网页、演示、文章等链接。 |
| `repo` | no | 代码仓库或开源项目链接。 |
| `contributors` | no | 对资料整理、代码、文案、设计、测试有贡献的人。 |
| `license` | yes | 展品或资料的许可协议。 |

## 文件放置

- 展品：`content/exhibits/<id>.json`
- 成员：`content/profiles/<id>.json`
- 历史节点：`content/history/<id>.json`
- 参考资料：`content/references/<id>.json` 或 Markdown

## 质量要求

- 不把推测写成事实。
- 不上传没有授权的媒体资源。
- 外部链接要尽量使用稳定地址。
- 作者、贡献者、许可协议必须清楚。
- 如果资料不完整，可以先提交，但要在说明中标注 `needs-review`。
