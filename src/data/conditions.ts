export interface GeneratorCountCondition {
  readonly count: number;
  readonly id: string;
}

export interface Condition {
  readonly all?: readonly Condition[];
  readonly any?: readonly Condition[];
  readonly debtGte?: string;
  readonly debtRatioGte?: number;
  readonly era?: number;
  readonly exitsGte?: number;
  readonly flag?: string;
  readonly generatorGte?: GeneratorCountCondition;
  readonly generatorTotalGte?: number;
  readonly hypeGte?: number;
  readonly hypeMaxGte?: number;
  readonly insightGainGte?: number;
  readonly insightSinceExitGte?: number;
  readonly iterationGte?: number;
  readonly locLifetimeGte?: string;
  readonly moneyGte?: string;
  readonly productCountGte?: number;
  readonly research?: string;
  readonly refactorGte?: number;
  readonly rewritesGte?: number;
  readonly seen?: string;
  readonly shipCountGte?: number;
  readonly timeInActMinGte?: number;
  readonly upgrade?: string;
}

export const REFACTOR_COMPLETED_STAT = "projects.refactored";
