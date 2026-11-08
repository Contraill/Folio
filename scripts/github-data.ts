/* The part of the GitHub step that decides what may be written: public repositories and pins only, never Folio's own. */
import type { RepoData } from '../src/content/discover.ts';

export type Node = {
  databaseId: number; name: string; isPrivate: boolean; isTemplate: boolean; isFork: boolean; isArchived: boolean;
  description: string | null; homepageUrl: string | null; pushedAt: string; createdAt: string; stargazerCount: number;
  primaryLanguage: { name: string } | null; languages: { nodes: { name: string }[] } | null;
  openGraphImageUrl: string | null; usesCustomOpenGraphImage: boolean; repositoryTopics: { nodes: { topic: { name: string } }[] };
  defaultBranchRef: { target: { messageHeadline?: string; committedDate?: string; url?: string } | null } | null;
};
export type Pin = { name: string; isPrivate: boolean };

export function publicData(nodes: Node[], pins: Pin[], self: string): { repos: RepoData[]; pins: string[] } {
  const own = self.toLowerCase();
  const repos = nodes.filter((n) => !n.isPrivate && n.name.toLowerCase() !== own).map((n): RepoData => {
    const head = n.defaultBranchRef?.target;
    return {
      id: n.databaseId, name: n.name, isPrivate: false, isTemplate: n.isTemplate, isFork: n.isFork, isArchived: n.isArchived,
      description: n.description || null, homepageUrl: n.homepageUrl || null, pushedAt: n.pushedAt, createdAt: n.createdAt,
      stargazerCount: n.stargazerCount, primaryLanguage: n.primaryLanguage?.name ?? null, languages: n.languages?.nodes.map((l) => l.name) ?? [],
      openGraphImageUrl: n.openGraphImageUrl, usesCustomOpenGraphImage: n.usesCustomOpenGraphImage, topics: n.repositoryTopics.nodes.map((t) => t.topic.name),
      lastCommit: head?.committedDate && head.url ? { message: head.messageHeadline ?? '', date: head.committedDate, url: head.url } : null,
    };
  });
  return { repos, pins: pins.filter((p) => !p.isPrivate && p.name.toLowerCase() !== own).map((p) => p.name) };
}
