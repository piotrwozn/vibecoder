import { big, type Big } from "../core/bignum";
import type { Condition } from "./conditions";

export interface EraDefinition {
  readonly cost?: Big;
  readonly demoLocked?: boolean;
  readonly id: string;
  readonly index: number;
  readonly modelKey: string;
  readonly unlock?: Condition;
}

export const ERAS: readonly EraDefinition[] = [
  {
    id: "e_parrot_1",
    index: 1,
    modelKey: "era.e1.model"
  },
  {
    id: "e_muse",
    index: 2,
    modelKey: "era.e2.model",
    cost: big(2e4)
  },
  {
    id: "e_golem",
    index: 3,
    modelKey: "era.e3.model",
    demoLocked: true,
    cost: big(5e6)
  },
  {
    id: "e_hydra",
    index: 4,
    modelKey: "era.e4.model",
    demoLocked: true,
    cost: big(2e9)
  },
  {
    id: "e_oracle",
    index: 5,
    modelKey: "era.e5.model",
    demoLocked: true,
    cost: big(8e11)
  },
  {
    id: "e_titan",
    index: 6,
    modelKey: "era.e6.model",
    demoLocked: true,
    cost: big(5e14)
  },
  {
    id: "e_demiurge",
    index: 7,
    modelKey: "era.e7.model",
    demoLocked: true,
    cost: big(5e17),
    unlock: { exitsGte: 1 }
  },
  {
    id: "e_ouroboros",
    index: 8,
    modelKey: "era.e8.model",
    demoLocked: true,
    cost: big(8e20)
  },
  {
    id: "e_basilisk",
    index: 9,
    modelKey: "era.e9.model",
    demoLocked: true,
    cost: big(2e24)
  },
  {
    id: "e_omega",
    index: 10,
    modelKey: "era.e10.model",
    demoLocked: true,
    cost: big(1e28),
    unlock: { flag: "omega_approved" }
  }
] as const;

export const STARTING_ERA = ERAS[0]!;
