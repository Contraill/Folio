/* The part of the GitHub step that decides what may be written: public repositories and pins only, never Folio's own. */
import type { RepoData } from '../src/content/discover.ts';

export type Node = Omit<RepoData, 'primaryLanguage' | 'topics' | 'folioYaml'> & {
  primaryLanguage: { name: string } | null; repositoryTopics: { nodes: { topic: { name: string } }[] }; folioYaml: { text: string } | null;
};
export type Pin = { name: string; isPrivate: boolean };

export function publicData(nodes: Node[], pins: Pin[], self: string): { repos: RepoData[]; pins: string[] } {
  const own = self.toLowerCase();
  const repos = nodes.filter((n) => !n.isPrivate && n.name.toLowerCase() !== own).map((n) => ({
    name: n.name, isPrivate: false, description: n.description, homepageUrl: n.homepageUrl || null, pushedAt: n.pushedAt, createdAt: n.createdAt,
    stargazerCount: n.stargazerCount, primaryLanguage: n.primaryLanguage?.name ?? null, openGraphImageUrl: n.openGraphImageUrl,
    usesCustomOpenGraphImage: n.usesCustomOpenGraphImage, topics: n.repositoryTopics.nodes.map((t) => t.topic.name), folioYaml: n.folioYaml?.text ?? null,
  }));
  return { repos, pins: pins.filter((p) => !p.isPrivate && p.name.toLowerCase() !== own).map((p) => p.name) };
}
