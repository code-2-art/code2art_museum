import { z } from "astro/zod";
import {
  exhibitSchema,
  historyNodeSchema,
  profileSchema,
  type Exhibit,
  type HistoryNode,
  type Profile
} from "./schemas";
import {
  demoAccounts,
  demoArchiveRecords,
  demoExhibitions,
  demoSubmissions,
  getDemoSubmissionOwner
} from "./demo";

export { demoAccounts, demoArchiveRecords, demoExhibitions, demoSubmissions } from "./demo";

export type { Exhibit, HistoryNode, Profile } from "./schemas";

export type MuseumRecord = {
  id: string;
  kind: "exhibit" | "profile" | "history" | "submission" | "exhibition" | "archive";
  type: string;
  title: string;
  description: string;
  meta: string;
  keywords: string[];
  href: string;
};

const exhibitModules = import.meta.glob("../../content/exhibits/*.json", {
  eager: true,
  import: "default"
}) as Record<string, unknown>;

const profileModules = import.meta.glob("../../content/profiles/*.json", {
  eager: true,
  import: "default"
}) as Record<string, unknown>;

const historyModules = import.meta.glob("../../content/history/*.json", {
  eager: true,
  import: "default"
}) as Record<string, unknown>;

function parseContent<T>(modules: Record<string, unknown>, schema: z.ZodType<T>, label: string) {
  return Object.entries(modules).map(([path, value]) => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;

    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "record"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid ${label} content in ${path}: ${issues}`);
  });
}

function assertUniqueIds(collections: Array<{ label: string; records: Array<{ id: string }> }>) {
  const seen = new Map<string, string>();
  for (const collection of collections) {
    for (const record of collection.records) {
      const previous = seen.get(record.id);
      if (previous) throw new Error(`Duplicate museum record id "${record.id}" in ${previous} and ${collection.label}`);
      seen.set(record.id, collection.label);
    }
  }
}

export const exhibits = parseContent(exhibitModules, exhibitSchema, "exhibit")
  .sort((a, b) => a.id.localeCompare(b.id));

export const profiles = parseContent(profileModules, profileSchema, "profile")
  .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

export const historyNodes = parseContent(historyModules, historyNodeSchema, "history")
  .sort((a, b) => a.year.localeCompare(b.year));

assertUniqueIds([
  { label: "exhibits", records: exhibits },
  { label: "profiles", records: profiles },
  { label: "history", records: historyNodes }
]);

export const museumRecords: MuseumRecord[] = [
  ...exhibits.map((exhibit) => ({
    id: exhibit.id,
    kind: "exhibit" as const,
    type: exhibit.type,
    title: exhibit.title,
    description: exhibit.description,
    meta: `${exhibit.year} / ${exhibit.author}`,
    keywords: [...exhibit.tools, ...exhibit.contributors, exhibit.process],
    href: `/exhibits/${exhibit.id}/`
  })),
  ...profiles.map((profile) => ({
    id: profile.id,
    kind: "profile" as const,
    type: "profile",
    title: profile.name,
    description: profile.relationToCode2Art,
    meta: profile.identity,
    keywords: [...profile.tools, ...profile.representativeWorks, profile.status],
    href: `/members/#${profile.id}`
  })),
  ...historyNodes.map((node) => ({
    id: node.id,
    kind: "history" as const,
    type: "history",
    title: node.title,
    description: node.description,
    meta: `${node.year} / ${node.status}`,
    keywords: [node.source, node.status],
    href: `/archive/#${node.id}`
  })),
  ...demoAccounts.map((account) => ({
    id: account.slug,
    kind: "profile" as const,
    type: "demo-account",
    title: account.name,
    description: account.bio,
    meta: `${account.identity} / 开发样本`,
    keywords: [...account.tools, account.email],
    href: `/members/#${account.slug}`
  })),
  ...demoSubmissions.map((submission) => {
    const owner = getDemoSubmissionOwner(submission);
    return {
      id: submission.id,
      kind: "submission" as const,
      type: submission.type,
      title: submission.title,
      description: submission.summary,
      meta: `${submission.year} / ${owner?.name ?? "开发样本"} / ${submission.status}`,
      keywords: [...submission.tools, submission.process, owner?.name ?? "", owner?.identity ?? "", ...submission.exhibitionIds],
      href: `/works/#${submission.id}`
    };
  }),
  ...demoExhibitions.map((exhibition) => {
    const works = demoSubmissions.filter((submission) => exhibition.submissionIds.includes(submission.id));
    const owners = works.map(getDemoSubmissionOwner).filter((account) => account !== undefined);
    return {
      id: exhibition.id,
      kind: "exhibition" as const,
      type: "exhibition",
      title: exhibition.title,
      description: exhibition.description,
      meta: `${exhibition.startDate} / ${exhibition.status} / ${exhibition.submissionIds.length} 件作品`,
      keywords: [
        exhibition.subtitle,
        exhibition.status,
        ...works.flatMap((work) => [work.title, ...work.tools]),
        ...owners.map((account) => account.name)
      ],
      href: `/exhibitions/#${exhibition.id}`
    };
  }),
  ...demoArchiveRecords.map((record) => ({
    id: record.id,
    kind: "archive" as const,
    type: record.category,
    title: record.title,
    description: record.description,
    meta: `${record.year} / ${record.status}`,
    keywords: [record.id, ...record.keywords, ...record.relatedIds],
    href: `/archive/#${record.id}`
  }))
];

export const buildProgress = [
  {
    id: "01",
    label: "Published MVP",
    title: "静态 MVP 与 3D 展馆上线",
    description: "GitHub Pages 从 /docs 发布，首页、展品、成员、贡献者和 3D 漫游展馆已经形成最小可见博物馆。"
  },
  {
    id: "02",
    label: "Site Plan",
    title: "确立导览式博物馆方向",
    description: "首页从目录式展示转向 Museum Agent 导览入口，搜索框承担个性化路线、档案解释和参与建议。"
  },
  {
    id: "03",
    label: "Index Design",
    title: "迁移到 Astro + TypeScript + Tailwind",
    description: "新首页使用国际化 light archive 视觉系统，以 Agent 导览台、证据地图和栏目索引作为首屏结构。"
  }
];

export const archiveEntrances = [
  { title: "作品", meta: "WORKS", description: "实验编程、生成艺术、互动媒体与 AI 原生作品。" },
  { title: "开源项目", meta: "PROJECTS", description: "工具、框架、仓库、建馆系统和社区基础设施。" },
  { title: "Prompt / Skill", meta: "METHODS", description: "可复用的提示、工作流、协作方式与创作方法。" },
  { title: "历史节点", meta: "HISTORY", description: "HUDOIT、code2art、AI 协作转向和建馆过程。" }
];

export const researchDirections = [
  "AI 原生创作",
  "Creative Coding",
  "Human on the Loop",
  "Prompt / Context / Harness / Loop Engineering",
  "社区档案方法"
];

export const agentQuestions = [
  "给我一条适合新手的参观路线",
  "我想看和生成艺术有关的早期作品",
  "有哪些作品用了 prompt engineering？",
  "我想找适合参与的项目"
];
