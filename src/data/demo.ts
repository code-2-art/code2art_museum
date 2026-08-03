import {
  demoAccountSchema,
  demoArchiveRecordSchema,
  demoExhibitionSchema,
  demoSubmissionSchema,
  type DemoAccount,
  type DemoArchiveRecord,
  type DemoExhibition,
  type DemoSubmission
} from "./schemas.ts";

const accountDrafts = [
  ["lin-miao", "林淼", "生成艺术家", "p5.js"],
  ["chen-yu", "陈屿", "互动装置创作者", "TouchDesigner"],
  ["zhou-ran", "周然", "AI 影像研究者", "ComfyUI"],
  ["he-qing", "何青", "声音艺术家", "Max/MSP"],
  ["wu-tong", "吴桐", "创意编程教师", "Processing"],
  ["luo-xi", "罗希", "独立游戏设计师", "Godot"],
  ["tang-ke", "唐可", "数据叙事设计师", "D3.js"],
  ["song-yi", "宋一", "开源工具维护者", "TypeScript"],
  ["zhao-ning", "赵宁", "社区档案研究者", "Obsidian"],
  ["gao-yue", "高越", "机器人艺术创作者", "Arduino"]
] as const;

export const demoAccounts: DemoAccount[] = accountDrafts.map(([slug, name, identity, tool], index) => demoAccountSchema.parse({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  slug: `demo-${slug}`,
  name,
  email: `${slug}@demo.code2art.local`,
  identity,
  bio: `${name}以${tool}为主要媒介，关注创作过程如何被记录、复现并转化为可公开讨论的社区档案。`,
  tools: [tool, "Museum Agent", index % 2 === 0 ? "Creative Coding" : "Human-AI Collaboration"]
}));

const workCounts = [1, 2, 3, 1, 2, 3, 1, 2, 3, 2];
const workTypes = ["artwork", "project", "prompt", "skill"] as const;
const workSubjects = ["流动的像素", "可听见的代码", "协作提示谱", "微型档案机", "生成式花园", "社区记忆地图"];

let workNumber = 0;
export const demoSubmissions: DemoSubmission[] = demoAccounts.flatMap((account, accountIndex) =>
  Array.from({ length: workCounts[accountIndex] }, (_, localIndex) => {
    workNumber += 1;
    const id = `demo-work-${String(workNumber).padStart(3, "0")}`;
    const type = workTypes[(accountIndex + localIndex) % workTypes.length];
    const subject = workSubjects[(workNumber - 1) % workSubjects.length];
    const exhibitionIndex = (workNumber - 1) % 5;
    return demoSubmissionSchema.parse({
      id,
      accountId: account.id,
      title: `${subject} ${String(localIndex + 1).padStart(2, "0")}`,
      type,
      year: String(2022 + (workNumber % 5)),
      summary: `${account.name}提交的${subject}开发样本，用于验证作品投稿、作者归属、策展分组、公开展示与 Agent 检索的完整链路。`,
      process: `样本记录从概念草图、工具实验到可展示版本的过程，并保留作者、工具、展览和档案之间的可追踪关系。`,
      tools: account.tools.slice(0, 2),
      status: workNumber % 6 === 0 ? "in_review" : workNumber % 4 === 0 ? "approved" : "published",
      exhibitionIds: [`demo-exhibition-${String(exhibitionIndex + 1).padStart(2, "0")}`]
    });
  })
);

const exhibitionDrafts = [
  ["可计算的自然", "从规则、随机性与时间中观察生成图像"],
  ["协作界面", "人、模型与工具如何共同留下创作证据"],
  ["代码的声音", "把程序结构翻译成可听见的空间"],
  ["微型公共档案", "用小规模、可维护的方法组织社区记忆"],
  ["开源之后", "把工具、方法和维护劳动作为展品"]
] as const;

export const demoExhibitions: DemoExhibition[] = exhibitionDrafts.map(([title, subtitle], index) => {
  const id = `demo-exhibition-${String(index + 1).padStart(2, "0")}`;
  return demoExhibitionSchema.parse({
    id,
    title,
    subtitle,
    description: `${subtitle}。本展由开发样本自动组展，用于测试展览—作品—作者—Archive 的交叉导航，不代表正式策展结论。`,
    status: index < 2 ? "open" : index < 4 ? "planning" : "archived",
    startDate: `2026-${String(index + 1).padStart(2, "0")}-15`,
    submissionIds: demoSubmissions.filter((work) => work.exhibitionIds.includes(id)).map((work) => work.id)
  });
});

const archiveCategories = ["work", "process", "event", "tool", "community"] as const;
const archiveTopics = ["生成规则", "提示迭代", "接口原型", "公开评议", "工具迁移", "展陈测试", "社区访谈", "版本记录"];

export const demoArchiveRecords: DemoArchiveRecord[] = Array.from({ length: 200 }, (_, index) => {
  const work = demoSubmissions[index % demoSubmissions.length];
  const account = demoAccounts[index % demoAccounts.length];
  const exhibition = demoExhibitions[index % demoExhibitions.length];
  const topic = archiveTopics[index % archiveTopics.length];
  const number = index + 1;
  return demoArchiveRecordSchema.parse({
    id: `demo-archive-${String(number).padStart(3, "0")}`,
    year: String(2010 + (index % 17)),
    title: `${topic} ${String(number).padStart(3, "0")}`,
    description: `围绕《${work.title}》整理的${topic}开发档案，关联作者${account.name}与展览《${exhibition.title}》，用于验证大规模检索、筛选和证据引用。`,
    category: archiveCategories[index % archiveCategories.length],
    keywords: [topic, account.tools[0], exhibition.title, work.type],
    relatedIds: [work.id, account.slug, exhibition.id],
    status: index % 7 === 0 ? "verified" : index % 5 === 0 ? "needs-review" : "seed"
  });
});

export function getDemoAccountSubmissions(accountId: string) {
  return demoSubmissions.filter((submission) => submission.accountId === accountId);
}

export function getDemoSubmissionOwner(submission: DemoSubmission) {
  return demoAccounts.find((account) => account.id === submission.accountId);
}
