import type { MuseumRecord } from "@/data/museum";

export type SearchResult = MuseumRecord & { score: number };

export type ExhibitionScheduleResult = {
  dateLabel: "今天" | "明天" | "后天";
  targetDate: string;
  hasScheduleData: boolean;
  openExhibitions: SearchResult[];
};

const intentTerms: Array<{ test: RegExp; terms: string[] }> = [
  { test: /新手|入门|第一次|路线/, terms: ["建馆", "hudoit", "历史", "prompt"] },
  { test: /生成|p5|视觉|艺术/, terms: ["生成", "p5.js", "artwork", "creative coding"] },
  { test: /prompt|skill|提示|工作流/i, terms: ["prompt", "skill", "ai", "协作"] },
  { test: /历史|hudoit|早期|来源/i, terms: ["历史", "hudoit", "2010", "论坛"] },
  { test: /参与|投稿|贡献|加入/, terms: ["项目", "社区", "贡献", "建设"] }
];

const normalize = (value: string) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim();

const toLocalIsoDate = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0")
].join("-");

export function resolveExhibitionSchedule(
  records: MuseumRecord[],
  rawQuery: string,
  now = new Date()
): ExhibitionScheduleResult | null {
  const query = normalize(rawQuery);
  if (!/展览|展出|开馆|开放/.test(query)) return null;

  const relativeDate = [
    { test: /后天/, label: "后天" as const, offset: 2 },
    { test: /明天/, label: "明天" as const, offset: 1 },
    { test: /今天|今日/, label: "今天" as const, offset: 0 }
  ].find((candidate) => candidate.test.test(query));
  if (!relativeDate) return null;

  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + relativeDate.offset);
  const exhibitions = records.filter((record) => record.kind === "exhibition" && record.schedule);
  const openExhibitions = exhibitions
    .filter((record) => record.schedule?.status === "open" && record.schedule.startDate <= toLocalIsoDate(target))
    .map((record) => ({ ...record, score: 20 }));

  return {
    dateLabel: relativeDate.label,
    targetDate: toLocalIsoDate(target),
    hasScheduleData: exhibitions.length > 0,
    openExhibitions
  };
}

export function buildExhibitionScheduleAnswer(schedule: ExhibitionScheduleResult) {
  const readableDate = schedule.targetDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1 年 $2 月 $3 日");
  if (!schedule.hasScheduleData) {
    return `${schedule.dateLabel}是 ${readableDate}。当前公开档案没有可核对的展览日程，暂时无法回答当天有什么展览。`;
  }

  const names = schedule.openExhibitions.map((record) => `《${record.title}》`);
  const openSummary = names.length
    ? `目前状态标记为“开放”的展览有 ${names.join("、")}。`
    : "目前没有状态标记为“开放”的展览。";
  return `${schedule.dateLabel}是 ${readableDate}。${openSummary}当前档案没有逐日开放时段或闭展日期，因此还不能据此确认当天的实际开放安排；请进入“展览”页核对最新日程。`;
}

export function searchMuseum(records: MuseumRecord[], rawQuery: string, limit = 6): SearchResult[] {
  const query = normalize(rawQuery);
  if (!query) return records.slice(0, limit).map((record, index) => ({ ...record, score: limit - index }));

  const tokens = Array.from(new Set([query, ...query.split(/[\s，。！？、/]+/).filter(Boolean)]));
  const boostedTerms = intentTerms.filter((intent) => intent.test.test(query)).flatMap((intent) => intent.terms);

  const ranked = records
    .map((record) => {
      const title = normalize(record.title);
      const summary = normalize(`${record.description} ${record.meta}`);
      const keywords = normalize(`${record.type} ${record.kind} ${record.keywords.join(" ")}`);
      let score = 0;

      for (const token of tokens) {
        if (title.includes(token)) score += 12;
        if (keywords.includes(token)) score += 7;
        if (summary.includes(token)) score += 4;
      }

      for (const term of boostedTerms) {
        const normalizedTerm = normalize(term);
        if (title.includes(normalizedTerm)) score += 5;
        if (keywords.includes(normalizedTerm) || summary.includes(normalizedTerm)) score += 3;
      }

      return { ...record, score };
    })
    .filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-CN"));

  const diverse: SearchResult[] = [];
  const kindCounts = new Map<MuseumRecord["kind"], number>();
  for (const record of ranked) {
    if ((kindCounts.get(record.kind) || 0) >= 2) continue;
    diverse.push(record);
    kindCounts.set(record.kind, (kindCounts.get(record.kind) || 0) + 1);
    if (diverse.length === limit) return diverse;
  }

  for (const record of ranked) {
    if (diverse.includes(record)) continue;
    diverse.push(record);
    if (diverse.length === limit) break;
  }
  return diverse;
}

export function buildGuideAnswer(query: string, results: SearchResult[]) {
  if (results.length === 0) {
    return "目前的公开档案里还没有足够证据回答这个问题。可以换一个关键词，或到“参与”页提交新的作品与历史线索。";
  }

  const names = results.slice(0, 3).map((record) => `《${record.title}》`);
  if (/展览|策展|展出/.test(query)) {
    const exhibition = results.find((record) => record.kind === "exhibition");
    const related = results.filter((record) => record.kind === "submission").slice(0, 2);
    if (exhibition) {
      const works = related.length ? `，相关作品包括 ${related.map((record) => `《${record.title}》`).join("、")}` : "";
      return `根据当前公开开发样本，可先进入展览《${exhibition.title}》核对策展关系${works}。这是测试数据关系，不代表正式馆藏或最终策展结论。`;
    }
  }
  if (/参与|投稿|贡献|加入/.test(query)) {
    return `建议先浏览 ${names.join("、")} 了解馆藏边界，再进入“参与”页提交材料。投稿会保留来源、授权与审核状态，不会直接自动公开。`;
  }
  if (/新手|入门|第一次|路线/.test(query)) {
    return `这条入门路线从 ${names.join("，再到 ")} 展开，依次建立社区背景、作品语境和 AI 协作方法。每一步都链接到当前公开档案。`;
  }

  return `公开档案中，与“${query}”最接近的是 ${names.join("、")}。下面按相关度列出证据，可以继续进入详情核对来源与创作过程。`;
}

