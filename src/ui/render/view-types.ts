import type {
  IncidentResponseId,
  ProjectDeploymentMode,
  RunStyleId,
  SprintPriority
} from "../../core/state";
import type { AppId, SceneId, TutorialStep, WindowFrame, WindowState } from "../../core/ui-state";
import type { WindowBounds } from "../wm/window-manager";
import type { ResearchView, RewriteView } from "./prestige-view-types";

export type {
  EquityPerkView,
  ExitPreviewView,
  ExitView,
  InsightNodeView,
  IterationPreviewView,
  ParadoxItemView,
  ParadoxView,
  ResearchNodeView,
  ResearchView,
  RewritePreviewView,
  RewriteView,
  RunModifierView
} from "./prestige-view-types";

export type GeneratorBuyQuantity = 1 | 10 | "max";

export interface PromptClickView {
  readonly loc: string;
}

export interface VibexSendView {
  readonly committed: boolean;
  readonly loc: string;
  readonly pendingResponse?: Promise<string>;
  readonly prompt: string;
  readonly response: string;
}

export type VibexPromptSource = "auto" | "manual";

export interface VibexFileView {
  readonly active: boolean;
  readonly id: string;
  readonly label: string;
}

export interface VibexCodeLineView {
  readonly id: string;
  readonly text: string;
}

export interface VibexView {
  readonly aiCanDownload: boolean;
  readonly aiEnabled: boolean;
  readonly aiModelSize: string;
  readonly aiProgress: string;
  readonly aiStatus: string;
  readonly cannedPrompt: string;
  readonly cannedResponse: string;
  readonly codeLines: readonly VibexCodeLineView[];
  readonly codeSequence: number;
  readonly files: readonly VibexFileView[];
}

export interface ScreenLink {
  readonly appId: AppId;
  readonly iconPath: string;
  readonly key: string;
  readonly shortcut?: string;
}

export type CommsChannel = "chat" | "mail" | "feed";
export type SettingsNotation = "sci" | "suffix";
export type LazyTooltip = string | (() => string);

export interface ResourceView {
  readonly bank: string;
  readonly bankTooltip: LazyTooltip;
  readonly bankVisible: boolean;
  readonly compute: string;
  readonly hype: string;
  readonly loc: string;
  readonly locRate: string;
  readonly locRateTooltip: LazyTooltip;
  readonly money: string;
  readonly moneyRate: string;
  readonly moneyRateTooltip: LazyTooltip;
  readonly rp: string;
}

export interface ModelView {
  readonly canBuy: boolean;
  readonly current: string;
  readonly maxed: boolean;
  readonly nextCost: string;
  readonly nextModel: string;
  readonly status: string;
}

export interface GeneratorRowView {
  readonly buy1Title: string;
  readonly buy10Title: string;
  readonly buyMaxTitle: string;
  readonly canBuy1: boolean;
  readonly canBuy10: boolean;
  readonly canBuyMax: boolean;
  readonly cost1: string;
  readonly cost10: string;
  readonly id: string;
  readonly locked: boolean;
  readonly milestoneLabel: string;
  readonly milestoneProgress: number;
  readonly name: string;
  readonly owned: string;
  readonly rate: string;
}

export interface ComputeRowView {
  readonly id: string;
  readonly name: string;
  readonly used: string;
}

export interface ComputeBreakdownView {
  readonly cap: string;
  readonly remaining: string;
  readonly rows: readonly ComputeRowView[];
  readonly used: string;
}

export interface HardwareRowView {
  readonly active: boolean;
  readonly canBuy: boolean;
  readonly capAdd: string;
  readonly cost: string;
  readonly id: string;
  readonly isEnclosure: boolean;
  readonly levelLabel: string;
  readonly name: string;
  readonly phase: "pc" | "server";
  readonly powerCost: string;
  readonly psuRequirement: string;
  readonly slot: string;
  readonly slotLabel: string;
}

export interface UpgradeRowView {
  readonly canBuy: boolean;
  readonly cost: string;
  readonly effect: string;
  readonly id: string;
  readonly name: string;
  readonly state: "available" | "bought" | "locked" | "unaffordable";
  readonly stateLabel: string;
}

export interface AutomationToggleView {
  readonly detail: string;
  readonly disabled: boolean;
  readonly enabled: boolean;
  readonly id: string;
  readonly label: string;
}

export interface ProjectOfferView {
  readonly buildTime: string;
  readonly canStart: boolean;
  readonly canStartHosted: boolean;
  readonly canStartSelfHosted: boolean;
  readonly compute: string;
  readonly continueDeploymentMode?: ProjectDeploymentMode;
  readonly cost: string;
  readonly hostingCost: string;
  readonly id: string;
  readonly isContinuation: boolean;
  readonly level: string;
  readonly name: string;
  readonly payout: string;
  readonly revenue: string;
  readonly tag: string;
}

export interface ActiveBuildView {
  readonly compute: string;
  readonly deployment: string;
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly remaining: string;
}

export interface ProductView {
  readonly canFix: boolean;
  readonly canSwitchDeployment: boolean;
  readonly compute: string;
  readonly deployment: string;
  readonly hostingCost: string;
  readonly id: string;
  readonly level: string;
  readonly name: string;
  readonly revenue: string;
  readonly status: string;
  readonly switchDeploymentLabel: string;
  readonly switchDeploymentMode: ProjectDeploymentMode;
}

export interface RefactorView {
  readonly buildTime: string;
  readonly canStart: boolean;
  readonly cost: string;
  readonly debt: string;
  readonly effect: string;
}

export interface ProjectsView {
  readonly activeBuilds: readonly ActiveBuildView[];
  readonly incomeRate: string;
  readonly nextUnlock: string;
  readonly offers: readonly ProjectOfferView[];
  readonly portfolio: readonly ProductView[];
  readonly refactor: RefactorView;
}

export interface RoadmapPriorityView {
  readonly active: boolean;
  readonly description: string;
  readonly disabled: boolean;
  readonly id: SprintPriority;
  readonly label: string;
}

export interface RoadmapIncidentResponseView {
  readonly cost: string;
  readonly description: string;
  readonly disabled: boolean;
  readonly id: IncidentResponseId;
  readonly label: string;
}

export interface RoadmapIncidentView {
  readonly description: string;
  readonly id: string;
  readonly label: string;
  readonly responses: readonly RoadmapIncidentResponseView[];
  readonly severity: string;
  readonly timeRemaining: string;
}

export interface RoadmapRunStyleView {
  readonly cost: string;
  readonly description: string;
  readonly id: RunStyleId;
  readonly label: string;
  readonly selected: boolean;
  readonly unlocked: boolean;
}

export interface RoadmapActivityView {
  readonly detail: string;
  readonly id: string;
  readonly label: string;
  readonly tone: "alert" | "info" | "success";
}

export interface RoadmapView {
  readonly activeSprint: string;
  readonly activity: readonly RoadmapActivityView[];
  readonly cooldown: string;
  readonly incidents: readonly RoadmapIncidentView[];
  readonly priorities: readonly RoadmapPriorityView[];
  readonly runStyles: readonly RoadmapRunStyleView[];
  readonly sprintRemaining: string;
}

export interface EndlessOfferView {
  readonly canAccept: boolean;
  readonly cost: string;
  readonly id: string;
  readonly modules: string;
  readonly modifiers: string;
  readonly name: string;
  readonly reward: string;
  readonly risks: string;
  readonly tier: string;
  readonly work: string;
}

export interface EndlessActiveContractView {
  readonly name: string;
  readonly progress: number;
  readonly progressLabel: string;
  readonly remaining: string;
  readonly reward: string;
  readonly risks: string;
}

export interface EndlessMilestoneView {
  readonly description: string;
  readonly id: string;
  readonly reached: boolean;
  readonly target: string;
}

export interface EndlessChallengeView {
  readonly active: boolean;
  readonly bestTier: string;
  readonly canStart: boolean;
  readonly completed: boolean;
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly reward: string;
}

export interface EndlessCurrencyView {
  readonly label: string;
  readonly value: string;
}

export interface EndlessEventView {
  readonly description: string;
  readonly name: string;
  readonly remaining: string;
}

export interface EndlessView {
  readonly active?: EndlessActiveContractView;
  readonly activeChallenge?: string;
  readonly activeEvent?: EndlessEventView;
  readonly canRefresh: boolean;
  readonly challenges: readonly EndlessChallengeView[];
  readonly cosmetics: readonly string[];
  readonly completed: string;
  readonly currencies: readonly EndlessCurrencyView[];
  readonly decision: string;
  readonly empireScore: string;
  readonly legacyScore: string;
  readonly milestones: readonly EndlessMilestoneView[];
  readonly offers: readonly EndlessOfferView[];
  readonly seasonDescription: string;
  readonly seasonName: string;
  readonly seasonRemaining: string;
  readonly softCaps: readonly string[];
  readonly tier: string;
  readonly unlockHint: string;
  readonly unlocked: boolean;
}

export interface AuroraNodeView {
  readonly id: string;
  readonly name: string;
  readonly state: "active" | "complete" | "locked";
}

export interface AuroraView {
  readonly availableServers: string;
  readonly canDedicate: boolean;
  readonly canFund: boolean;
  readonly canHost: boolean;
  readonly canReleaseHost: boolean;
  readonly completed: boolean;
  readonly costLoc: string;
  readonly costMoney: string;
  readonly dedicatedServers: string;
  readonly hostedServers: string;
  readonly hostingRate: string;
  readonly nodes: readonly AuroraNodeView[];
  readonly phaseName: string;
  readonly progress: number;
  readonly progressLabel: string;
  readonly readyServers: string;
  readonly readyServerCount: number;
  readonly requiredServers: string;
  readonly statusLabel: string;
  readonly timeRemaining: string;
  readonly unlocked: boolean;
}

export interface StatsRowView {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface StatsView {
  readonly lifetimeRows: readonly StatsRowView[];
  readonly recordsRows: readonly StatsRowView[];
  readonly runRows: readonly StatsRowView[];
  readonly sparklineEmpty: boolean;
  readonly sparklineLabel: string;
  readonly sparklinePath: string;
}

export interface AchievementCardView {
  readonly category: string;
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly unlocked: boolean;
}

export interface AchievementsView {
  readonly bonus: string;
  readonly cards: readonly AchievementCardView[];
  readonly unlocked: string;
}

export interface AppearanceView {
  readonly ending?: "fork" | "merge" | "unplug";
  readonly glitch: boolean;
  readonly reducedFx: boolean;
  readonly theme?: "crt" | "glitch" | "void";
}

export interface SettingsView {
  readonly autosaveS: string;
  readonly doNotDisturb: boolean;
  readonly glitch: boolean;
  readonly localAiCanDownload: boolean;
  readonly localAiModelSize: string;
  readonly localAiProgress: string;
  readonly localAiStatus: string;
  readonly lang: string;
  readonly notation: SettingsNotation;
  readonly reducedFx: boolean;
  readonly skipIntro: boolean;
  readonly sound: boolean;
  readonly vibexLocalAi: boolean;
  readonly volume: string;
  readonly save: SaveDiagnosticsView;
}

export interface SaveDiagnosticsView {
  readonly backupCount: string;
  readonly edition: string;
  readonly lastAutosave: string;
  readonly status: string;
  readonly version: string;
}

export interface OfflineView {
  readonly duration: string;
  readonly hype: string;
  readonly loc: string;
  readonly money: string;
  readonly visible: boolean;
}

export interface TutorialView {
  readonly active: boolean;
  readonly completed: boolean;
  readonly index: number;
  readonly step: TutorialStep;
  readonly total: number;
}

export interface FullGameView {
  readonly visible: boolean;
}

export interface CommsChoiceView {
  readonly id: string;
  readonly label: string;
  readonly selected: boolean;
}

export interface CommsMessageView {
  readonly channel: CommsChannel;
  readonly choices: readonly CommsChoiceView[];
  readonly entryId: string;
  readonly eventId: string;
  readonly lines: readonly string[];
  readonly pendingChoice: boolean;
  readonly speaker: string;
  readonly unread: boolean;
}

export interface CommsView {
  readonly messages: readonly CommsMessageView[];
  readonly quiet: boolean;
  readonly unreadByChannel: Readonly<Record<CommsChannel, number>>;
  readonly unreadCount: number;
}

export interface EndingModalView {
  readonly choices: readonly CommsChoiceView[];
  readonly eventId: string;
  readonly lines: readonly string[];
  readonly visible: boolean;
}

export interface GameOverView {
  readonly lines: readonly string[];
  readonly overdraft: string;
  readonly visible: boolean;
}

export interface ShellUiView {
  readonly bootSeen: boolean;
  readonly hasSave: boolean;
  readonly scene: SceneId;
  readonly windows: Record<AppId, WindowState>;
}

export interface DevFloorView {
  readonly appearance: AppearanceView;
  readonly achievements: AchievementsView;
  readonly automation: readonly AutomationToggleView[];
  readonly aurora: AuroraView;
  readonly comms: CommsView;
  readonly compute: ComputeBreakdownView;
  readonly ending: EndingModalView;
  readonly endless: EndlessView;
  readonly flowActive: boolean;
  readonly flowMeter: string;
  readonly flowProgress: number;
  readonly fullGame: FullGameView;
  readonly gameOver: GameOverView;
  readonly generators: readonly GeneratorRowView[];
  readonly hardware: readonly HardwareRowView[];
  readonly model: ModelView;
  readonly offline: OfflineView;
  readonly projects: ProjectsView;
  readonly roadmap: RoadmapView;
  readonly research: ResearchView;
  readonly rewrite: RewriteView;
  readonly resources: ResourceView;
  readonly settings: SettingsView;
  readonly stats: StatsView;
  readonly tutorial: TutorialView;
  readonly ui: ShellUiView;
  readonly upgrades: readonly UpgradeRowView[];
  readonly vibex: VibexView;
}

export interface AppActions {
  acceptEndlessContract(id: string): void;
  changeGlitch(enabled: boolean): void;
  changeLang(lang: string): void;
  chooseEndlessDecision(decision: "continue" | "reset"): void;
  buyEra(): void;
  buyEquityPerk(id: string): void;
  buyInsightNode(id: string): void;
  buyParadoxItem(id: string): void;
  buyResearch(id: string): void;
  buyGenerator(id: string, quantity: GeneratorBuyQuantity): void;
  buyHardware(id: string): void;
  buyUpgrade(id: string): void;
  changeAutosaveS(seconds: number): void;
  changeDoNotDisturb(enabled: boolean): void;
  changeNotation(notation: SettingsNotation): void;
  changeReducedFx(enabled: boolean): void;
  changeSkipIntro(enabled: boolean): void;
  changeSound(enabled: boolean): void;
  changeVibexLocalAi(enabled: boolean): void;
  changeVolume(volume: number): void;
  closeApp(appId: AppId): void;
  dedicateAuroraServer(): void;
  dismissOffline(): void;
  exportSave(): string;
  focusApp(appId: AppId): void;
  importSave(payload: string): boolean;
  maximizeApp(appId: AppId, bounds: WindowBounds): void;
  minimizeApp(appId: AppId): void;
  moveApp(appId: AppId, frame: Pick<WindowFrame, "x" | "y">, bounds: WindowBounds): void;
  fitOpenWindowsToBounds(bounds: WindowBounds): void;
  openApp(appId: AppId, bounds: WindowBounds): void;
  openDiscord(): void;
  fixBug(productId: string): void;
  playBootSound(): void;
  playUiClick(): void;
  prompt(): PromptClickView;
  sendVibexPrompt(prompt: string, source?: VibexPromptSource): VibexSendView;
  chooseStoryChoice(eventId: string, choiceId: string): void;
  exit(): void;
  iterate(): void;
  rewrite(): void;
  resetWindowLayout(): void;
  refreshEndlessOffers(): void;
  replayTutorial(): void;
  resizeApp(appId: AppId, frame: WindowFrame, bounds: WindowBounds): void;
  resolveIncident(id: string, response: IncidentResponseId): void;
  selectRunStyle(id: RunStyleId): void;
  selectSprintPriority(id: SprintPriority): void;
  selectRunModifier(id: string | undefined): void;
  startDesktop(): void;
  fundAuroraPhase(): void;
  rentAuroraHost(): void;
  releaseAuroraHost(): void;
  setProjectDeploymentMode(productId: string, mode: ProjectDeploymentMode): void;
  startNewGame(): void;
  startProject(id: string, deploymentMode?: ProjectDeploymentMode): void;
  startEndlessChallenge(id: string): void;
  startRefactor(): void;
  toggleAutomation(id: string, enabled: boolean): void;
  tutorialBack(): void;
  tutorialNext(): void;
  tutorialSkip(): void;
  downloadVibexModel(): void;
  quitToTitle(): void;
  resetSettings(): void;
  wipeSave(): void;
}

export interface AppShell {
  addTerminalLog(message: string): void;
  destroy(): void;
  showToast(message: string, tone?: ToastTone, options?: ToastOptions): void;
  updateDevFloor(view: DevFloorView): void;
  updateFrameAlpha(alpha: number): void;
}

export type ToastTone = "accent" | "danger" | "gold";

export interface ToastOptions {
  readonly iconPath?: string;
  readonly onClick?: () => void;
}
