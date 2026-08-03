import { z } from "astro/zod";

const slugSchema = z.string().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/i);
const shortText = z.string().min(1).max(160);
const listItem = z.string().min(1).max(240);

export const exhibitSchema = z.object({
  id: slugSchema,
  title: shortText,
  type: z.enum(["artwork", "project", "prompt", "skill", "profile", "history"]),
  author: z.string().min(1).max(120),
  year: z.string().min(1).max(24),
  tools: z.array(listItem).max(40),
  description: z.string().min(20).max(1200),
  process: z.string().min(1).max(6000),
  media: z.array(z.string().min(1).max(1000)).max(20),
  repo: z.string().max(1000),
  contributors: z.array(listItem).max(80),
  license: z.string().min(1).max(120)
}).strict();

export const profileSchema = z.object({
  id: slugSchema,
  name: z.string().min(1).max(120),
  avatar: z.string().min(1).max(1000),
  identity: shortText,
  tools: z.array(listItem).max(40),
  representativeWorks: z.array(listItem).max(80),
  relationToCode2Art: z.string().min(10).max(1200),
  links: z.array(z.string().min(1).max(1000)).max(30),
  status: z.string().min(1).max(80)
}).strict();

export const historyNodeSchema = z.object({
  id: slugSchema,
  year: z.string().min(1).max(24),
  title: shortText,
  description: z.string().min(20).max(1200),
  source: z.string().min(1).max(500),
  status: z.enum(["seed", "verified", "needs-review"])
}).strict();

export const demoAccountSchema = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().min(1).max(120),
  email: z.string().email(),
  identity: shortText,
  bio: z.string().min(20).max(600),
  tools: z.array(listItem).min(1).max(12)
}).strict();

export const demoSubmissionSchema = z.object({
  id: slugSchema,
  accountId: z.string().uuid(),
  title: shortText,
  type: z.enum(["artwork", "project", "prompt", "skill"]),
  year: z.string().min(1).max(24),
  summary: z.string().min(20).max(1200),
  process: z.string().min(20).max(2000),
  tools: z.array(listItem).min(1).max(12),
  status: z.enum(["draft", "submitted", "in_review", "changes_requested", "approved", "published"]),
  exhibitionIds: z.array(slugSchema).max(5)
}).strict();

export const demoExhibitionSchema = z.object({
  id: slugSchema,
  title: shortText,
  subtitle: shortText,
  description: z.string().min(20).max(1200),
  status: z.enum(["planning", "open", "archived"]),
  startDate: z.string().date(),
  submissionIds: z.array(slugSchema).min(1).max(20)
}).strict();

export const demoArchiveRecordSchema = z.object({
  id: slugSchema,
  year: z.string().min(1).max(24),
  title: shortText,
  description: z.string().min(20).max(1200),
  category: z.enum(["work", "process", "event", "tool", "community"]),
  keywords: z.array(listItem).min(1).max(12),
  relatedIds: z.array(slugSchema).min(1).max(8),
  status: z.enum(["seed", "verified", "needs-review"])
}).strict();

export type Exhibit = z.infer<typeof exhibitSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type HistoryNode = z.infer<typeof historyNodeSchema>;
export type DemoAccount = z.infer<typeof demoAccountSchema>;
export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;
export type DemoExhibition = z.infer<typeof demoExhibitionSchema>;
export type DemoArchiveRecord = z.infer<typeof demoArchiveRecordSchema>;

