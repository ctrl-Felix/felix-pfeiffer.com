import messages from "@/data/messageCount.json";

const entries = () => Object.values(messages.userMessages as unknown as Record<string, [day: string, model: string]>);

export const messageTotal = () => entries().length;

export function messagesByModel() {
  const counts = new Map<string, number>();
  for (const [, model] of entries()) counts.set(model, (counts.get(model) ?? 0) + 1);
  return counts;
}
