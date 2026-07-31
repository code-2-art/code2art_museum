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

export type Exhibit = z.infer<typeof exhibitSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type HistoryNode = z.infer<typeof historyNodeSchema>;

