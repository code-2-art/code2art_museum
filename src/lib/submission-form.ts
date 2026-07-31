export const MAX_SUBMISSION_FILES = 5;
export const MAX_SUBMISSION_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_SUBMISSION_TOOLS = 40;
export const MAX_SUBMISSION_SOURCE_LINKS = 20;

export const ALLOWED_SUBMISSION_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "application/pdf"
]);

type FileCandidate = {
  name: string;
  type: string;
  size: number;
};

export function safeSubmissionFileName(name: string) {
  return name
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
}

export function parseSubmissionTools(value: string) {
  const tools = [...new Set(value.split(/[,，]/).map((item) => item.trim()).filter(Boolean))];
  if (tools.length > MAX_SUBMISSION_TOOLS) {
    return { tools, error: `工具 / 技术最多填写 ${MAX_SUBMISSION_TOOLS} 项。` };
  }
  if (tools.some((item) => item.length > 120)) {
    return { tools, error: "单项工具 / 技术名称不能超过 120 个字符。" };
  }
  return { tools, error: null };
}

export function parseSubmissionSourceLinks(value: string) {
  const links = [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
  if (links.length > MAX_SUBMISSION_SOURCE_LINKS) {
    return { links, error: `来源链接最多填写 ${MAX_SUBMISSION_SOURCE_LINKS} 条。` };
  }

  for (const link of links) {
    if (link.length > 2048) return { links, error: "单条来源链接不能超过 2048 个字符。" };
    try {
      const url = new URL(link);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
        return { links, error: `来源链接必须是无账号信息的 HTTP(S) 地址：${link}` };
      }
    } catch {
      return { links, error: `来源链接格式无效：${link}` };
    }
  }

  return { links, error: null };
}

export function validateSubmissionFiles(files: FileCandidate[]) {
  if (files.length > MAX_SUBMISSION_FILES) return `附件最多上传 ${MAX_SUBMISSION_FILES} 个。`;
  for (const file of files) {
    if (file.size <= 0) return `附件“${file.name}”是空文件。`;
    if (file.size > MAX_SUBMISSION_FILE_BYTES) return `附件“${file.name}”超过 25 MB。`;
    if (file.name.length > 255) return "附件文件名不能超过 255 个字符。";
    if (!ALLOWED_SUBMISSION_MIME_TYPES.has(file.type)) return `附件“${file.name}”的文件类型不受支持。`;
  }
  return null;
}
