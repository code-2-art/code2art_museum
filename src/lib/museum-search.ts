import type { MuseumRecord } from "@/data/museum";

export type SearchResult = MuseumRecord & { score: number };

const intentTerms: Array<{ test: RegExp; terms: string[] }> = [
  { test: /新手|入门|第一次|路线/, terms: ["建馆", "hudoit", "历史", "prompt"] },
  { test: /生成|p5|视觉|艺术/, terms: ["生成", "p5.js", "artwork", "creative coding"] },
  { test: /prompt|skill|提示|工作流/i, terms: ["prompt", "skill", "ai", "协作"] },
  { test: /历史|hudoit|早期|来源/i, terms: ["历史", "hudoit", "2010", "论坛"] },
  { test: /参与|投稿|贡献|加入/, terms: ["项目", "社区", "贡献", "建设"] }
];

const normalize = (value: string) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim();

export function searchMuseum(records: MuseumRecord[], rawQuery: string, limit = 6): SearchResult[] {
  const query = normalize(rawQuery);
  if (!query) return records.slice(0, limit).map((record, index) => ({ ...record, score: limit - index }));

  const tokens = Array.from(new Set([query, ...query.split(/[\s，。！？、/]+/).filter(Boolean)]));
  const boostedTerms = intentTerms.filter((intent) => intent.test.test(query)).flatMap((intent) => intent.terms);

  return records
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
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-CN"))
    .slice(0, limit);
}

export function buildGuideAnswer(query: string, results: SearchResult[]) {
  if (results.length === 0) {
    return "目前的公开档案里还没有足够证据回答这个问题。可以换一个关键词，或到“参与”页提交新的作品与历史线索。";
  }

  const names = results.slice(0, 3).map((record) => `《${record.title}》`);
  if (/参与|投稿|贡献|加入/.test(query)) {
    return `建议先浏览 ${names.join("、")} 了解馆藏边界，再进入“参与”页提交材料。投稿会保留来源、授权与审核状态，不会直接自动公开。`;
  }
  if (/新手|入门|第一次|路线/.test(query)) {
    return `这条入门路线从 ${names.join("，再到 ")} 展开，依次建立社区背景、作品语境和 AI 协作方法。每一步都链接到当前公开档案。`;
  }

  return `公开档案中，与“${query}”最接近的是 ${names.join("、")}。下面按相关度列出证据，可以继续进入详情核对来源与创作过程。`;
}

