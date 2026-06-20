export type Exhibit = {
  id: string;
  title: string;
  type: string;
  author: string;
  year: string;
  tools: string[];
  description: string;
  process: string;
  media: string[];
  repo: string;
  contributors: string[];
  license: string;
};

export type Profile = {
  id: string;
  name: string;
  avatar: string;
  identity: string;
  tools: string[];
  representativeWorks: string[];
  relationToCode2Art: string;
  links: string[];
  status: string;
};

export type HistoryNode = {
  id: string;
  year: string;
  title: string;
  description: string;
  source: string;
  status: string;
};

const exhibitModules = import.meta.glob("../../content/exhibits/*.json", {
  eager: true,
  import: "default"
}) as Record<string, Exhibit>;

const profileModules = import.meta.glob("../../content/profiles/*.json", {
  eager: true,
  import: "default"
}) as Record<string, Profile>;

const historyModules = import.meta.glob("../../content/history/*.json", {
  eager: true,
  import: "default"
}) as Record<string, HistoryNode>;

export const exhibits = Object.values(exhibitModules).sort((a, b) => a.id.localeCompare(b.id));

export const profiles = Object.values(profileModules).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

export const historyNodes = Object.values(historyModules).sort((a, b) => a.year.localeCompare(b.year));

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
