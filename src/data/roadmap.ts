import type { SprintPriority } from "../core/state";

export interface SprintPriorityDefinition {
  readonly cooldownS: number;
  readonly descriptionKey: string;
  readonly durationS: number;
  readonly id: SprintPriority;
  readonly nameKey: string;
}

export const SPRINT_PRIORITIES: readonly SprintPriorityDefinition[] = [
  {
    id: "stability",
    nameKey: "roadmap.sprint.stability.name",
    descriptionKey: "roadmap.sprint.stability.effect",
    durationS: 10 * 60,
    cooldownS: 5 * 60
  },
  {
    id: "growth",
    nameKey: "roadmap.sprint.growth.name",
    descriptionKey: "roadmap.sprint.growth.effect",
    durationS: 10 * 60,
    cooldownS: 5 * 60
  },
  {
    id: "revenue",
    nameKey: "roadmap.sprint.revenue.name",
    descriptionKey: "roadmap.sprint.revenue.effect",
    durationS: 10 * 60,
    cooldownS: 5 * 60
  },
  {
    id: "research",
    nameKey: "roadmap.sprint.research.name",
    descriptionKey: "roadmap.sprint.research.effect",
    durationS: 10 * 60,
    cooldownS: 5 * 60
  },
  {
    id: "automation",
    nameKey: "roadmap.sprint.automation.name",
    descriptionKey: "roadmap.sprint.automation.effect",
    durationS: 10 * 60,
    cooldownS: 5 * 60
  },
  {
    id: "aurora",
    nameKey: "roadmap.sprint.aurora.name",
    descriptionKey: "roadmap.sprint.aurora.effect",
    durationS: 10 * 60,
    cooldownS: 5 * 60
  }
] as const;

export function getSprintPriority(id: string): SprintPriorityDefinition | undefined {
  return SPRINT_PRIORITIES.find((priority) => priority.id === id);
}
