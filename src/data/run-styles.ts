import type { RunStyleId } from "../core/state";

export interface RunStyleDefinition {
  readonly costKey: string;
  readonly effectKey: string;
  readonly id: RunStyleId;
  readonly nameKey: string;
  readonly unlock: "aurora" | "exit" | "iteration";
}

export const RUN_STYLES: readonly RunStyleDefinition[] = [
  {
    id: "bootstrapped",
    nameKey: "runStyle.bootstrapped.name",
    effectKey: "runStyle.bootstrapped.effect",
    costKey: "runStyle.bootstrapped.cost",
    unlock: "exit"
  },
  {
    id: "vc_backed",
    nameKey: "runStyle.vc_backed.name",
    effectKey: "runStyle.vc_backed.effect",
    costKey: "runStyle.vc_backed.cost",
    unlock: "exit"
  },
  {
    id: "research_lab",
    nameKey: "runStyle.research_lab.name",
    effectKey: "runStyle.research_lab.effect",
    costKey: "runStyle.research_lab.cost",
    unlock: "exit"
  },
  {
    id: "cursed_enterprise",
    nameKey: "runStyle.cursed_enterprise.name",
    effectKey: "runStyle.cursed_enterprise.effect",
    costKey: "runStyle.cursed_enterprise.cost",
    unlock: "iteration"
  },
  {
    id: "open_source_collective",
    nameKey: "runStyle.open_source_collective.name",
    effectKey: "runStyle.open_source_collective.effect",
    costKey: "runStyle.open_source_collective.cost",
    unlock: "exit"
  },
  {
    id: "aurora_first",
    nameKey: "runStyle.aurora_first.name",
    effectKey: "runStyle.aurora_first.effect",
    costKey: "runStyle.aurora_first.cost",
    unlock: "aurora"
  }
] as const;

export function getRunStyle(id: string): RunStyleDefinition | undefined {
  return RUN_STYLES.find((style) => style.id === id);
}
