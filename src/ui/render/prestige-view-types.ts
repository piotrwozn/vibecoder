export interface ResearchNodeView {
  readonly branch: string;
  readonly canBuy: boolean;
  readonly cost: string;
  readonly effect: string;
  readonly id: string;
  readonly name: string;
  readonly state: "available" | "bought" | "locked" | "unaffordable";
  readonly stateLabel: string;
  readonly tier: number;
}

export interface ResearchView {
  readonly nodes: readonly ResearchNodeView[];
  readonly rp: string;
}

export interface InsightNodeView {
  readonly branch: string;
  readonly canBuy: boolean;
  readonly cost: string;
  readonly effect: string;
  readonly id: string;
  readonly name: string;
  readonly state: "available" | "bought" | "locked" | "unaffordable";
  readonly stateLabel: string;
  readonly tier: number;
}

export interface RewritePreviewView {
  readonly afterInsight: string;
  readonly booting: boolean;
  readonly canRewrite: boolean;
  readonly currentMultiplier: string;
  readonly gain: string;
  readonly lostAgents: string;
  readonly lostHardware: string;
  readonly lostLoc: string;
  readonly lostMoney: string;
  readonly lostProducts: string;
  readonly lostUpgrades: string;
  readonly requiredInsight: string;
  readonly speedup: string;
  readonly startEra: string;
  readonly startGenerators: string;
  readonly startMoney: string;
  readonly targetMultiplier: string;
}

export interface EquityPerkView {
  readonly canBuy: boolean;
  readonly cost: string;
  readonly effect: string;
  readonly id: string;
  readonly name: string;
  readonly state: "available" | "bought" | "locked" | "unaffordable";
  readonly stateLabel: string;
}

export interface RunModifierView {
  readonly active: boolean;
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly selected: boolean;
  readonly unlocked: boolean;
}

export interface ParadoxItemView {
  readonly canBuy: boolean;
  readonly cost: string;
  readonly effect: string;
  readonly id: string;
  readonly name: string;
  readonly state: "available" | "bought" | "locked" | "unaffordable";
  readonly stateLabel: string;
}

export interface IterationPreviewView {
  readonly canIterate: boolean;
  readonly currentIteration: string;
  readonly currentMultiplier: string;
  readonly currentParadox: string;
  readonly hold: string;
  readonly locRate: string;
  readonly nextIteration: string;
  readonly paradoxAfter: string;
  readonly paradoxGain: string;
  readonly softcapThreshold: string;
  readonly targetMultiplier: string;
}

export interface ParadoxView {
  readonly items: readonly ParadoxItemView[];
  readonly preview: IterationPreviewView;
  readonly ruleSlots: string;
  readonly theme: string;
  readonly unlocked: boolean;
}

export interface ExitPreviewView {
  readonly canExit: boolean;
  readonly currentEquity: string;
  readonly currentMultiplier: string;
  readonly equityAfter: string;
  readonly gain: string;
  readonly requiredInsight: string;
  readonly rewardMultiplier: string;
  readonly targetMultiplier: string;
  readonly totalInsightEarned: string;
}

export interface ExitView {
  readonly perks: readonly EquityPerkView[];
  readonly preview: ExitPreviewView;
  readonly runModifiers: readonly RunModifierView[];
}

export interface RewriteView {
  readonly exit: ExitView;
  readonly insight: string;
  readonly nodes: readonly InsightNodeView[];
  readonly paradox: ParadoxView;
  readonly preview: RewritePreviewView;
}
