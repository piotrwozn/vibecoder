import { t } from "../i18n/i18n";
import {
  APP_IDS,
  type AppId,
  type SceneId,
  type TutorialStep,
  type WindowFrame,
  type WindowState
} from "../core/ui-state";
import { el, setText, text } from "./dom";
import { clampWindow, isWindowVisible, type WindowBounds } from "./wm/window-manager";

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

interface ScreenLink {
  readonly appId: AppId;
  readonly iconPath: string;
  readonly key: string;
  readonly shortcut?: string;
}

type CommsChannel = "chat" | "mail" | "feed";
type SettingsNotation = "sci" | "suffix";

export interface ResourceView {
  readonly compute: string;
  readonly hype: string;
  readonly loc: string;
  readonly locRate: string;
  readonly locRateTooltip: string;
  readonly money: string;
  readonly moneyRate: string;
  readonly moneyRateTooltip: string;
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
  readonly cost: string;
  readonly id: string;
  readonly name: string;
  readonly payout: string;
  readonly revenue: string;
  readonly tag: string;
}

export interface ActiveBuildView {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly remaining: string;
}

export interface ProductView {
  readonly canFix: boolean;
  readonly id: string;
  readonly name: string;
  readonly revenue: string;
  readonly status: string;
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
  readonly offers: readonly ProjectOfferView[];
  readonly portfolio: readonly ProductView[];
  readonly refactor: RefactorView;
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

export interface DevFloorView {
  readonly appearance: AppearanceView;
  readonly achievements: AchievementsView;
  readonly automation: readonly AutomationToggleView[];
  readonly aurora: AuroraView;
  readonly comms: CommsView;
  readonly compute: ComputeBreakdownView;
  readonly ending: EndingModalView;
  readonly flowActive: boolean;
  readonly flowMeter: string;
  readonly flowProgress: number;
  readonly fullGame: FullGameView;
  readonly generators: readonly GeneratorRowView[];
  readonly hardware: readonly HardwareRowView[];
  readonly model: ModelView;
  readonly offline: OfflineView;
  readonly projects: ProjectsView;
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

export interface ShellUiView {
  readonly bootSeen: boolean;
  readonly scene: SceneId;
  readonly windows: Record<AppId, WindowState>;
}

export interface AppActions {
  changeGlitch(enabled: boolean): void;
  changeLang(lang: string): void;
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
  openApp(appId: AppId, bounds: WindowBounds): void;
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
  replayTutorial(): void;
  resizeApp(appId: AppId, frame: WindowFrame, bounds: WindowBounds): void;
  selectRunModifier(id: string | undefined): void;
  startDesktop(): void;
  fundAuroraPhase(): void;
  rentAuroraHost(): void;
  startProject(id: string): void;
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

interface ResourceCounterNodes {
  readonly root: HTMLElement;
  readonly value: Text;
}

interface ResourceCounterSet {
  readonly compute: ResourceCounterNodes;
  readonly hype: ResourceCounterNodes;
  readonly loc: ResourceCounterNodes;
  readonly locRate: ResourceCounterNodes;
  readonly money: ResourceCounterNodes;
  readonly moneyRate: ResourceCounterNodes;
  readonly rp: ResourceCounterNodes;
}

interface ModelNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly status: Text;
  readonly value: Text;
}

interface ComputeBreakdownNodes {
  readonly cap: Text;
  readonly list: HTMLElement;
  readonly remaining: Text;
  readonly used: Text;
}

interface ComputeRowNodes {
  readonly name: Text;
  readonly root: HTMLElement;
  readonly used: Text;
}

interface GeneratorRowNodes {
  readonly buy1: HTMLButtonElement;
  readonly buy10: HTMLButtonElement;
  readonly buyMax: HTMLButtonElement;
  readonly cost1: Text;
  readonly cost10: Text;
  readonly milestone: Text;
  readonly milestoneBar: HTMLElement;
  readonly name: Text;
  readonly owned: Text;
  readonly rate: Text;
  readonly root: HTMLElement;
}

interface HardwareRowNodes {
  readonly buy: HTMLButtonElement;
  readonly cap: Text;
  readonly cost: Text;
  readonly level: Text;
  readonly power: Text;
  readonly requirement: Text;
  readonly root: HTMLElement;
  readonly slot: Text;
}

interface HardwareAuroraCounterNodes {
  readonly root: HTMLElement;
  readonly value: Text;
}

interface UpgradeRowNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface AutomationToggleNodes {
  readonly checkbox: HTMLInputElement;
  readonly detail: Text;
  readonly root: HTMLElement;
}

interface ProjectOfferNodes {
  readonly buildTime: Text;
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly payout: Text;
  readonly revenue: Text;
  readonly root: HTMLElement;
  readonly tag: Text;
}

interface ActiveBuildNodes {
  readonly progress: HTMLElement;
  readonly remaining: Text;
  readonly root: HTMLElement;
}

interface ProductNodes {
  readonly fix: HTMLButtonElement;
  readonly revenue: Text;
  readonly root: HTMLElement;
  readonly status: Text;
}

interface AuroraNodes {
  readonly availableServers: Text;
  readonly costLoc: Text;
  readonly costMoney: Text;
  readonly dedicate: HTMLButtonElement;
  readonly dedicatedServers: Text;
  readonly fund: HTMLButtonElement;
  readonly host: HTMLButtonElement;
  readonly hostedServers: Text;
  readonly hostingRate: Text;
  readonly phaseName: Text;
  readonly progressBar: HTMLElement;
  readonly progressLabel: Text;
  readonly readyServers: Text;
  readonly requiredServers: Text;
  readonly status: Text;
  readonly timeRemaining: Text;
}

interface AuroraNodeNodes {
  readonly root: HTMLElement;
  readonly state: Text;
}

interface RefactorNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly debt: Text;
  readonly effect: Text;
}

interface ResearchNodeNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface InsightNodeNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface EquityPerkNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface RunModifierNodes {
  readonly button: HTMLButtonElement;
  readonly description: Text;
  readonly root: HTMLElement;
}

interface ParadoxItemNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface ParadoxNodes {
  readonly button: HTMLButtonElement;
  readonly currentIteration: Text;
  readonly currentMultiplier: Text;
  readonly currentParadox: Text;
  readonly hold: Text;
  readonly locRate: Text;
  readonly nextIteration: Text;
  readonly paradoxAfter: Text;
  readonly paradoxGain: Text;
  readonly root: HTMLElement;
  readonly ruleSlots: Text;
  readonly softcapThreshold: Text;
  readonly targetMultiplier: Text;
  readonly theme: Text;
}

interface StatsRowNodes {
  readonly value: Text;
}

interface StatsNodes {
  readonly empty: HTMLElement;
  readonly path: SVGPathElement;
  readonly svg: SVGSVGElement;
}

interface AchievementCardNodes {
  readonly category: Text;
  readonly description: Text;
  readonly root: HTMLElement;
  readonly status: Text;
  readonly title: Text;
}

interface AchievementsNodes {
  readonly bonus: Text;
  readonly grid: HTMLElement;
  readonly unlocked: Text;
}

interface ResearchSummaryNodes {
  readonly rp: Text;
}

interface RewriteNodes {
  readonly afterInsight: Text;
  readonly boot: HTMLElement;
  readonly bootOverlay: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly currentMultiplier: Text;
  readonly gain: Text;
  readonly insight: Text;
  readonly lostAgents: Text;
  readonly lostHardware: Text;
  readonly lostLoc: Text;
  readonly lostMoney: Text;
  readonly lostProducts: Text;
  readonly lostUpgrades: Text;
  readonly requiredInsight: Text;
  readonly speedup: Text;
  readonly startEra: Text;
  readonly startGenerators: Text;
  readonly startMoney: Text;
  readonly targetMultiplier: Text;
}

interface ExitNodes {
  readonly button: HTMLButtonElement;
  readonly currentEquity: Text;
  readonly currentMultiplier: Text;
  readonly equityAfter: Text;
  readonly gain: Text;
  readonly requiredInsight: Text;
  readonly rewardMultiplier: Text;
  readonly targetMultiplier: Text;
  readonly totalInsightEarned: Text;
}

interface ProjectSummaryNodes {
  readonly income: Text;
}

interface SettingsNodes {
  readonly autosaveS: HTMLInputElement;
  readonly downloadVibexModel: HTMLButtonElement;
  readonly doNotDisturb: HTMLInputElement;
  readonly glitch: HTMLInputElement;
  readonly localAiProgress: Text;
  readonly localAiStatus: Text;
  readonly notation: HTMLSelectElement;
  readonly reducedFx: HTMLInputElement;
  readonly skipIntro: HTMLInputElement;
  readonly sound: HTMLInputElement;
  readonly vibexLocalAi: HTMLInputElement;
  readonly volume: HTMLInputElement;
}

interface BootNodes {
  currentLang: string;
  readonly credits: HTMLElement;
  readonly langButton: HTMLButtonElement;
  readonly langLabel: Text;
  readonly root: HTMLElement;
  readonly settings: HTMLElement;
  readonly settingsNodes: BootSettingsNodes;
  readonly startLabel: Text;
}

interface BootSettingsNodes {
  readonly langValue: Text;
  readonly root: HTMLElement;
}

type BootSettingsTab = "audio" | "gameplay" | "video";
type BootVisualTheme = "crt" | "violet" | "amber";

interface DesktopNodes {
  currentScene: SceneId;
  readonly iconNodes: Record<AppId, DesktopIconNodes>;
  readonly root: HTMLElement;
  readonly taskbarNodes: TaskbarNodes;
  readonly tutorialNodes: TutorialNodes;
  readonly windowNodes: Record<AppId, WindowNodes>;
  readonly windowsLayer: HTMLElement;
  currentWindows: Record<AppId, WindowState>;
}

interface DesktopIconNodes {
  readonly badge: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly label: string;
}

interface TaskbarNodes {
  readonly items: Record<AppId, TaskbarItemNodes>;
  readonly root: HTMLElement;
}

interface TaskbarItemNodes {
  readonly button: HTMLButtonElement;
  readonly label: string;
}

interface WindowNodes {
  readonly content: HTMLElement;
  hideTimer: number | undefined;
  readonly root: HTMLElement;
  readonly title: Text;
  wasVisible: boolean;
}

interface TutorialNodes {
  readonly back: HTMLButtonElement;
  readonly body: Text;
  readonly finish: HTMLButtonElement;
  readonly next: HTMLButtonElement;
  readonly progress: Text;
  readonly root: HTMLElement;
  readonly skip: HTMLButtonElement;
  readonly title: Text;
}

interface FullGameNodes {
  readonly root: HTMLElement;
}

interface OfflineNodes {
  readonly duration: Text;
  readonly hype: Text;
  readonly loc: Text;
  readonly money: Text;
  readonly root: HTMLElement;
}

interface CommsNodes {
  readonly badge: HTMLElement;
  readonly channel: CommsChannel;
  currentView: CommsView | undefined;
  readonly empty: HTMLElement;
  lastEntryId: string;
  readonly list: HTMLElement;
  readonly messages: Map<string, CommsMessageNodes>;
  messageCount: number;
  readonly root: HTMLElement;
}

interface EndingModalNodes {
  readonly root: HTMLElement;
  signature: string;
}

interface CommsMessageNodes {
  readonly choices: HTMLElement;
  readonly lines: readonly Text[];
  readonly root: HTMLElement;
  readonly selected: Text;
}

interface TerminalViewNodes {
  readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
  readonly cannedPrompt: Text;
  readonly cannedResponse: Text;
  readonly flowBar: HTMLElement;
  readonly flowText: Text;
  readonly input: HTMLTextAreaElement;
  readonly logRoot: HTMLElement;
  readonly prompt: HTMLButtonElement;
  readonly root: HTMLElement;
  readonly showParticle: (value: string) => void;
}

interface VibexNodes {
  readonly cannedPrompt: Text;
  readonly cannedResponse: Text;
  readonly codeRows: HTMLElement[];
  readonly codeStream: HTMLElement;
  readonly codeTexts: Text[];
  readonly fileRows: Map<string, HTMLElement>;
  readonly fileTexts: Map<string, Text>;
  lastCodeSequence: number;
  readonly root: HTMLElement;
  readonly terminal: TerminalViewNodes;
}

interface TerminalLogRow {
  readonly root: HTMLElement;
  readonly text: Text;
}

interface TerminalLogOptions {
  readonly priority?: boolean;
}

interface TerminalParticle {
  readonly root: HTMLElement;
  readonly text: Text;
}

interface ToastPool {
  readonly root: HTMLElement;
  readonly show: (message: string, tone: ToastTone, options?: ToastOptions) => void;
}

interface ToastNode {
  onClick: (() => void) | undefined;
  readonly icon: HTMLElement;
  readonly root: HTMLButtonElement;
  readonly text: Text;
}

const TERMINAL_LOG_CAPACITY = 200;
const TERMINAL_LOG_RATE_LIMIT = 10;
const CLICK_PARTICLE_POOL_SIZE = 10;
const TOAST_POOL_SIZE = 3;

const appIconSources: Partial<Record<AppId, string>> = {
  achievements: new URL("../../images/app-icons/achievements.png", import.meta.url).href,
  agents: new URL("../../images/app-icons/agents.png", import.meta.url).href,
  chat: new URL("../../images/app-icons/chat.png", import.meta.url).href,
  feed: new URL("../../images/app-icons/feed.png", import.meta.url).href,
  hardware: new URL("../../images/app-icons/hardware.png", import.meta.url).href,
  mail: new URL("../../images/app-icons/mail.png", import.meta.url).href,
  projects: new URL("../../images/app-icons/projects.png", import.meta.url).href,
  research: new URL("../../images/app-icons/research.png", import.meta.url).href,
  rewrite: new URL("../../images/app-icons/rewrite.png", import.meta.url).href,
  settings: new URL("../../images/app-icons/settings.png", import.meta.url).href,
  stats: new URL("../../images/app-icons/stats.png", import.meta.url).href,
  upgrades: new URL("../../images/app-icons/upgrades.png", import.meta.url).href,
  vibex: new URL("../../images/app-icons/vibex.png", import.meta.url).href
};

const screenLinks: readonly ScreenLink[] = [
  {
    appId: "vibex",
    key: "ui.app.vibex",
    shortcut: "1",
    iconPath: "M5 5h14v10H5z M8 19h8 M10 15v4 M8 9l2 2-2 2 M12 13h4"
  },
  {
    appId: "agents",
    key: "ui.app.agents",
    shortcut: "2",
    iconPath: "M4 6h16v3H4z M4 11h10v3H4z M4 16h16v2H4z"
  },
  {
    appId: "hardware",
    key: "ui.app.hardware",
    shortcut: "3",
    iconPath:
      "M5 17h14 M7 7h10v8H7z M9 3v4 M15 3v4 M9 15v4 M15 15v4 M3 9h4 M17 9h4 M3 13h4 M17 13h4"
  },
  {
    appId: "upgrades",
    key: "ui.app.upgrades",
    shortcut: "4",
    iconPath: "M12 4v16 M5 11l7-7 7 7 M6 20h12"
  },
  {
    appId: "projects",
    key: "ui.app.projects",
    shortcut: "5",
    iconPath: "M4 5h7l2 2h7v12H4z"
  },
  {
    appId: "aurora",
    key: "ui.app.aurora",
    iconPath:
      "M12 3l2.4 5.1 5.6.7-4.1 3.9 1 5.5L12 15.5 7.1 18.2l1-5.5L4 8.8l5.6-.7z M12 8v4 M12 15h.01"
  },
  {
    appId: "research",
    key: "ui.app.research",
    shortcut: "6",
    iconPath: "M12 3a4 4 0 0 0-2 7.46V13h4v-2.54A4 4 0 0 0 12 3z M9 16h6 M10 20h4"
  },
  {
    appId: "rewrite",
    key: "ui.app.rewrite",
    iconPath: "M6 7h10l-3-3 M16 17H6l3 3 M17 8a6 6 0 0 1-6 10 M7 16A6 6 0 0 1 13 6"
  },
  {
    appId: "stats",
    key: "ui.app.stats",
    iconPath: "M5 19V9 M12 19V5 M19 19v-7"
  },
  {
    appId: "achievements",
    key: "ui.app.achievements",
    iconPath: "M7 4h10v3a5 5 0 0 1-4 4.9V16h3v4H8v-4h3v-4.1A5 5 0 0 1 7 7z"
  },
  {
    appId: "chat",
    key: "ui.app.chat",
    iconPath: "M4 5h16v11H8l-4 4z M8 9h8 M8 12h6"
  },
  {
    appId: "mail",
    key: "ui.app.mail",
    iconPath: "M4 6h16v12H4z M4 7l8 6 8-6"
  },
  {
    appId: "feed",
    key: "ui.app.feed",
    iconPath: "M6 5h12 M6 9h12 M6 13h8 M6 17h10"
  },
  {
    appId: "settings",
    key: "ui.app.settings",
    shortcut: "7",
    iconPath:
      "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 2v3 M12 19v3 M4.93 4.93l2.12 2.12 M16.95 16.95l2.12 2.12 M2 12h3 M19 12h3 M4.93 19.07l2.12-2.12 M16.95 7.05l2.12-2.12"
  }
];

export function getAppIconPath(appId: AppId): string | undefined {
  return screenLinks.find((link) => link.appId === appId)?.iconPath;
}

const BOOT_ZOOM_MS = 1800;
const BOOT_FADE_MS = 180;

const endingClasses = [
  "app-shell--ending-fork",
  "app-shell--ending-merge",
  "app-shell--ending-unplug"
] as const;
const terminalThemeClasses = [
  "terminal--theme-crt",
  "terminal--theme-glitch",
  "terminal--theme-void"
] as const;

const generatorRows = new Map<string, GeneratorRowNodes>();
const computeRows = new Map<string, ComputeRowNodes>();
const hardwareRows = new Map<string, HardwareRowNodes>();
const upgradeRows = new Map<string, UpgradeRowNodes>();
const automationToggles = new Map<string, AutomationToggleNodes>();
const projectOffers = new Map<string, ProjectOfferNodes>();
const activeBuilds = new Map<string, ActiveBuildNodes>();
const products = new Map<string, ProductNodes>();
const auroraNodeRows = new Map<string, AuroraNodeNodes>();
const researchNodes = new Map<string, ResearchNodeNodes>();
const insightNodes = new Map<string, InsightNodeNodes>();
const equityPerks = new Map<string, EquityPerkNodes>();
const runModifiers = new Map<string, RunModifierNodes>();
const paradoxItems = new Map<string, ParadoxItemNodes>();
const statsRows = new Map<string, StatsRowNodes>();
const achievementCards = new Map<string, AchievementCardNodes>();
let modelNodes: ModelNodes | undefined;
let exitNodes: ExitNodes | undefined;
let paradoxNodes: ParadoxNodes | undefined;
let statsNodes: StatsNodes | undefined;
let achievementsNodes: AchievementsNodes | undefined;
let computeBreakdownNodes: ComputeBreakdownNodes | undefined;
let settingsNodes: SettingsNodes | undefined;
let fullGameNodes: FullGameNodes | undefined;
let offlineNodes: OfflineNodes | undefined;
let auroraNodes: AuroraNodes | undefined;
let hardwareAuroraCounterNodes: HardwareAuroraCounterNodes | undefined;

export function mountApp(root: HTMLElement, view: DevFloorView, actions: AppActions): AppShell {
  resetRenderCaches();

  const shell = el("div", { className: "app-shell" });
  const counters = createResourceCounters(view.resources);
  const screens = createScreens(view, actions);
  const offline = createOfflineModal(view.offline, actions);
  const terminal = createTerminal(view.vibex, actions);
  const vibex = createVibexWorkspace(view.vibex, terminal);
  const vibexModel = createModelPanel(view.model, actions);
  const comms = createCommsPanels(view.comms, actions);
  const desktop = createDesktop(view, counters, screens, vibex, vibexModel, comms, actions);
  const boot = createBootScene(view, actions);
  const ending = createEndingModal(view.ending, actions);
  const toasts = createToasts();
  shell.append(boot.root, desktop.root, toasts.root, offline, ending.root);
  const keydownHandler = (event: KeyboardEvent): void => {
    handleShortcut(event, desktop, vibex.terminal, actions);
  };
  window.addEventListener("keydown", keydownHandler);

  root.replaceChildren(shell);
  updateAppearance(shell, vibex.terminal.root, view.appearance);

  return {
    destroy(): void {
      window.removeEventListener("keydown", keydownHandler);
    },

    updateDevFloor(nextView: DevFloorView): void {
      updateAppearance(shell, vibex.terminal.root, nextView.appearance);
      updateBootScene(boot, nextView);
      updateResourceCounters(counters, nextView.resources);
      updateDesktop(desktop, nextView);

      if (isAppVisible(nextView.ui.windows, "vibex")) {
        setText(vibex.terminal.flowText, nextView.flowMeter);
        vibex.terminal.flowBar.style.transform = `scaleX(${nextView.flowProgress.toFixed(3)})`;
        vibex.terminal.root.classList.toggle("terminal--flow", nextView.flowActive);
        updateModel(nextView.model);
        updateVibex(vibex, nextView.vibex);
      }

      if (isAppVisible(nextView.ui.windows, "agents")) {
        syncGeneratorRows(nextView.generators, screens.agents, actions);
        updateComputeBreakdown(nextView.compute);
        syncAutomationToggles(nextView.automation, screens.agents, actions);
      }

      if (isAppVisible(nextView.ui.windows, "hardware")) {
        syncHardwareRows(nextView.hardware, screens.hardware, actions);
        updateHardwareAuroraCounter(nextView.aurora);
      }

      if (isAppVisible(nextView.ui.windows, "upgrades")) {
        syncUpgradeRows(nextView.upgrades, screens.upgrades, actions);
      }

      if (isAppVisible(nextView.ui.windows, "projects")) {
        updateProjects(nextView.projects, screens, actions);
      }

      if (isAppVisible(nextView.ui.windows, "aurora")) {
        updateAurora(nextView.aurora);
      }

      if (isAppVisible(nextView.ui.windows, "research")) {
        updateResearch(nextView.research);
      }

      if (isAppVisible(nextView.ui.windows, "rewrite")) {
        updateRewrite(nextView.rewrite);
      }

      if (isAppVisible(nextView.ui.windows, "stats")) {
        updateStats(nextView.stats);
      }

      if (isAppVisible(nextView.ui.windows, "achievements")) {
        updateAchievements(nextView.achievements, screens);
      }

      if (isAppVisible(nextView.ui.windows, "settings")) {
        updateSettings(nextView.settings);
      }

      updateFullGame(nextView.fullGame);
      updateVisibleCommsApps(comms, nextView, actions);
      updateOffline(nextView.offline);
      updateEndingModal(ending, nextView.ending, actions);
    },

    updateFrameAlpha(alpha: number): void {
      void alpha;
    },

    addTerminalLog(message: string): void {
      vibex.terminal.addLog(message);
    },

    showToast(message: string, tone: ToastTone = "accent", options?: ToastOptions): void {
      toasts.show(message, tone, options);
    }
  };
}

function resetRenderCaches(): void {
  generatorRows.clear();
  computeRows.clear();
  hardwareRows.clear();
  upgradeRows.clear();
  automationToggles.clear();
  projectOffers.clear();
  activeBuilds.clear();
  products.clear();
  auroraNodeRows.clear();
  researchNodes.clear();
  insightNodes.clear();
  equityPerks.clear();
  runModifiers.clear();
  paradoxItems.clear();
  statsRows.clear();
  achievementCards.clear();
  modelNodes = undefined;
  exitNodes = undefined;
  paradoxNodes = undefined;
  statsNodes = undefined;
  achievementsNodes = undefined;
  computeBreakdownNodes = undefined;
  settingsNodes = undefined;
  fullGameNodes = undefined;
  offlineNodes = undefined;
  auroraNodes = undefined;
  hardwareAuroraCounterNodes = undefined;
}

function createBootScene(view: DevFloorView, actions: AppActions): BootNodes {
  const root = el("section", { className: "boot-scene" });
  const room = el("div", { className: "boot-scene__room" });
  const mugSteam = createBootMugSteam();
  const monitor = el("div", { className: "boot-scene__monitor" });
  const screen = el("div", { className: "boot-scene__screen" });
  const stickyNotes = createBootStickyNotes();
  const title = el("h1", { className: "boot-scene__title" });
  title.append(text(t("app.title")));
  const terminalLine = el("p", { className: "boot-scene__terminal-line" });
  terminalLine.append(text(t("ui.boot.terminalLine")));
  const statusLine = el("p", { className: "boot-scene__status-line" });
  statusLine.append(text(t("ui.boot.statusLine")));

  const startLabel = text("");
  const start = el("button", {
    className: "boot-scene__button boot-scene__button--primary",
    title: t("ui.boot.start")
  });
  start.type = "button";
  start.append(startLabel);
  const continueButton = el("button", {
    className: "boot-scene__button boot-scene__button--secondary boot-scene__button--continue",
    title: t("ui.boot.continue")
  });
  continueButton.type = "button";
  continueButton.append(text(t("ui.boot.continue")));

  const bootSettings = createBootSettings(view.settings, actions);
  const settings = createBootPanel("ui.boot.settingsTitle", bootSettings.root);
  settings.classList.add("boot-panel--settings");
  const credits = createBootPanel("ui.boot.creditsTitle", createBootCredits());
  const settingsButton = createBootToggle("ui.boot.settings", settings);
  settingsButton.classList.add("boot-scene__button--secondary", "boot-scene__button--settings");
  settingsButton.addEventListener("click", () => {
    root.classList.toggle("boot-scene--settings-open", !settings.hidden);
    if (!settings.hidden) {
      credits.hidden = true;
    }
  });
  settings.querySelectorAll<HTMLElement>("[data-boot-settings-close]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.hidden = true;
      root.classList.remove("boot-scene--settings-open");
    });
  });
  const langLabel = text(t("ui.boot.languageValue", { lang: view.settings.lang.toUpperCase() }));
  const langButton = el("button", {
    className: "boot-scene__button boot-scene__button--link boot-scene__button--language",
    title: t("ui.boot.language")
  });
  langButton.type = "button";
  langButton.append(langLabel);
  langButton.addEventListener("click", () => {
    actions.changeLang(nodes.currentLang === "en" ? "pl" : "en");
  });
  const creditsButton = createBootToggle("ui.boot.credits", credits);
  creditsButton.classList.add("boot-scene__button--link", "boot-scene__button--credits");
  const buttons = el("div", { className: "boot-scene__actions" });
  buttons.append(start, continueButton, settingsButton, langButton, creditsButton);
  screen.append(stickyNotes, title, terminalLine, statusLine, buttons, settings, credits);
  monitor.append(screen);
  room.append(mugSteam, monitor);
  root.append(room);
  root.addEventListener(
    "click",
    (event) => {
      if (shouldPlayBootMenuClick(event)) {
        actions.playUiClick();
      }
    },
    { capture: true }
  );

  let transitionTimer: number | undefined;
  const finish = (): void => {
    if (transitionTimer !== undefined) {
      window.clearTimeout(transitionTimer);
      transitionTimer = undefined;
    }

    root.classList.remove("boot-scene--entering", "boot-scene--fade");
    actions.startDesktop();
  };

  const beginBootTransition = (event: Event): void => {
    event.stopPropagation();
    if (transitionTimer !== undefined) {
      return;
    }

    actions.playBootSound();
    const reduced = root.classList.contains("boot-scene--reduced-motion") || prefersReducedMotion();
    root.classList.add(reduced ? "boot-scene--fade" : "boot-scene--entering");
    transitionTimer = window.setTimeout(finish, reduced ? BOOT_FADE_MS : BOOT_ZOOM_MS);
  };
  start.addEventListener("click", beginBootTransition);
  continueButton.addEventListener("click", beginBootTransition);
  root.addEventListener("click", () => {
    if (transitionTimer !== undefined) {
      finish();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && transitionTimer !== undefined) {
      event.preventDefault();
      finish();
    }
  });

  const nodes: BootNodes = {
    credits,
    currentLang: view.settings.lang,
    langButton,
    langLabel,
    root,
    settings,
    settingsNodes: bootSettings,
    startLabel
  };
  updateBootScene(nodes, view);
  return nodes;
}

function shouldPlayBootMenuClick(event: Event): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const control = target.closest<HTMLElement>("button, input, select, textarea, [role='button']");

  if (control === null || control.closest(".boot-scene") === null) {
    return false;
  }

  if ("disabled" in control && typeof control.disabled === "boolean") {
    return !control.disabled;
  }

  return true;
}

function createBootMugSteam(): HTMLElement {
  const steam = el("span", { className: "boot-mug-steam" });
  steam.setAttribute("aria-hidden", "true");
  steam.append(
    el("span", { className: "boot-mug-steam__trail boot-mug-steam__trail--a" }),
    el("span", { className: "boot-mug-steam__trail boot-mug-steam__trail--b" }),
    el("span", { className: "boot-mug-steam__trail boot-mug-steam__trail--c" })
  );
  return steam;
}

function createBootStickyNotes(): HTMLElement {
  const notes = el("div", { className: "boot-sticky-notes" });
  notes.setAttribute("aria-hidden", "true");
  notes.append(
    el("span", { className: "boot-sticky-note boot-sticky-note--yellow" }),
    el("span", { className: "boot-sticky-note boot-sticky-note--pink" }),
    el("span", { className: "boot-sticky-note boot-sticky-note--blue" })
  );
  return notes;
}

function updateBootScene(nodes: BootNodes, view: DevFloorView): void {
  nodes.root.hidden = view.ui.scene !== "boot";
  nodes.currentLang = view.settings.lang;
  setText(nodes.startLabel, t("ui.boot.start"));
  setText(nodes.langLabel, t("ui.boot.languageValue", { lang: view.settings.lang.toUpperCase() }));
  nodes.langButton.title = t("ui.boot.language");
  setText(nodes.settingsNodes.langValue, view.settings.lang.toUpperCase());
  const bootLangLabel = nodes.settingsNodes.root.querySelector<HTMLElement>(
    "[data-boot-lang-label='1']"
  );
  const bootLangRow = nodes.settingsNodes.root.querySelector<HTMLElement>(
    "[data-boot-setting='language']"
  );
  if (bootLangLabel !== null) {
    bootLangLabel.textContent = t("ui.settings.language");
  }
  if (bootLangRow !== null) {
    bootLangRow.title = t("ui.settings.language");
  }
  syncBootSettings(nodes.settingsNodes.root, view.settings);
  nodes.root.classList.toggle("boot-scene--reduced-motion", view.appearance.reducedFx);
}

function createBootToggle(labelKey: string, panel: HTMLElement): HTMLButtonElement {
  const button = el("button", {
    className: "boot-scene__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  return button;
}

function createBootPanel(titleKey: string, content: HTMLElement): HTMLElement {
  const panel = el("section", { className: "boot-panel" });
  panel.hidden = true;
  const title = el("h2", { className: "boot-panel__title" });
  title.append(text(t(titleKey)));
  panel.append(title, content);
  return panel;
}

function createBootSettings(view: SettingsView, actions: AppActions): BootSettingsNodes {
  const root = el("div", { className: "boot-settings" });
  root.dataset.theme = "crt";
  const subtitle = el("p", { className: "boot-settings__subtitle" });
  subtitle.append(text(t("ui.boot.settings.subtitle")));
  const badge = el("span", { className: "boot-settings__badge" });
  const badgeLabel = text("");
  badge.append(badgeLabel);
  const back = createBootSettingsAction("ui.boot.settings.back");
  back.dataset.bootSettingsClose = "1";

  const tabRail = el("div", { className: "boot-settings__tab-rail" });
  const panels = {
    audio: createBootSettingsAudioPanel(view, actions),
    gameplay: createBootSettingsGameplayPanel(view, actions),
    video: createBootSettingsVideoPanel(view, actions, root)
  } satisfies Record<BootSettingsTab, HTMLElement>;
  const footer = el("div", { className: "boot-settings__footer" });
  const reset = createBootSettingsAction("ui.boot.settings.reset");
  reset.classList.add("boot-settings__action--danger");
  reset.addEventListener("click", () => {
    actions.resetSettings();
    resetBootVisualSettings(root);
  });
  const footerStatus = el("span", { className: "boot-settings__footer-status" });
  const footerStatusLabel = text("");
  footerStatus.append(footerStatusLabel);
  const apply = createBootSettingsAction("ui.boot.settings.apply");
  apply.classList.add("boot-settings__action--apply");
  apply.dataset.bootSettingsClose = "1";
  footer.append(reset, footerStatus, apply);

  const tabButtons = {
    audio: createBootSettingsTab("ui.boot.settings.tab.audio"),
    gameplay: createBootSettingsTab("ui.boot.settings.tab.gameplay"),
    video: createBootSettingsTab("ui.boot.settings.tab.video")
  } satisfies Record<BootSettingsTab, HTMLButtonElement>;

  const setTab = (tab: BootSettingsTab): void => {
    root.dataset.tab = tab;
    setText(
      badgeLabel,
      t("ui.boot.settings.tabBadge", {
        tab: t(`ui.boot.settings.tab.${tab}`).toUpperCase()
      })
    );
    setText(footerStatusLabel, t(`ui.boot.settings.footer.${tab}`));

    for (const candidate of Object.keys(panels) as BootSettingsTab[]) {
      panels[candidate].hidden = candidate !== tab;
      tabButtons[candidate].classList.toggle("boot-settings__tab--active", candidate === tab);
      tabButtons[candidate].setAttribute("aria-selected", String(candidate === tab));
    }
  };

  for (const tab of Object.keys(tabButtons) as BootSettingsTab[]) {
    tabButtons[tab].addEventListener("click", () => {
      setTab(tab);
    });
  }

  tabRail.append(tabButtons.video, tabButtons.audio, tabButtons.gameplay);
  root.append(back, subtitle, badge, tabRail, panels.video, panels.audio, panels.gameplay, footer);
  setTab("video");

  const langValue =
    panels.gameplay.querySelector<HTMLElement>("[data-boot-lang-value]")?.firstChild;

  return {
    langValue:
      langValue === null || langValue === undefined
        ? text(view.lang.toUpperCase())
        : (langValue as Text),
    root
  };
}

function createBootSettingsVideoPanel(
  view: SettingsView,
  actions: AppActions,
  settingsRoot: HTMLElement
): HTMLElement {
  const panel = createBootSettingsPanel("video", "ui.boot.settings.panel.video");
  const appearance = createBootSettingsPanel("appearance", "ui.boot.settings.panel.appearance");
  const fullscreen = el("div", { className: "boot-settings__fullscreen-row" });
  const fullscreenLabel = el("span", { className: "boot-settings__row-label" });
  fullscreenLabel.append(text(t("ui.boot.settings.fullscreen")));
  const fullscreenOff = createBootSettingsAction("ui.boot.settings.off");
  const fullscreenOn = createBootSettingsAction("ui.boot.settings.on");
  const displayMode = createBootInfoRow(
    "ui.boot.settings.displayMode",
    t("ui.boot.settings.windowed")
  );
  displayMode.dataset.bootSetting = "displayMode";
  const displayOutput = displayMode.querySelector<HTMLElement>(".boot-settings__row-value");
  const setFullscreenUi = (enabled: boolean): void => {
    fullscreenOff.classList.toggle("boot-settings__pill--active", !enabled);
    fullscreenOn.classList.toggle("boot-settings__pill--active", enabled);
    displayMode.setAttribute("aria-pressed", String(enabled));
    if (displayOutput !== null) {
      displayOutput.textContent = t(
        enabled ? "ui.boot.settings.displayFullscreen" : "ui.boot.settings.windowed"
      );
    }
  };
  const applyFullscreen = (enabled: boolean): void => {
    setFullscreenUi(enabled);
    void (enabled ? enterBrowserFullscreen() : exitBrowserFullscreen()).catch(() => {
      setFullscreenUi(isBrowserFullscreen());
    });
  };
  document.addEventListener("fullscreenchange", () => {
    setFullscreenUi(isBrowserFullscreen());
  });
  fullscreenOff.classList.add("boot-settings__pill--active");
  fullscreenOff.addEventListener("click", () => {
    applyFullscreen(false);
  });
  fullscreenOn.addEventListener("click", () => {
    applyFullscreen(true);
  });
  displayMode.addEventListener("click", () => {
    applyFullscreen(displayMode.getAttribute("aria-pressed") !== "true");
  });
  fullscreen.append(fullscreenLabel, fullscreenOff, fullscreenOn);
  setFullscreenUi(isBrowserFullscreen());
  panel.append(fullscreen, displayMode, createBootUiScaleRow(settingsRoot));
  appearance.append(
    createBootThemeChoices(settingsRoot),
    createBootToggleRow("ui.boot.settings.crtFilter", view.glitch, actions.changeGlitch, "glitch"),
    createBootToggleRow(
      "ui.boot.settings.reducedMotion",
      view.reducedFx,
      actions.changeReducedFx,
      "reducedFx"
    )
  );

  const root = el("div", { className: "boot-settings__panels" });
  root.dataset.tabPanel = "video";
  root.append(panel, appearance);
  return root;
}

function createBootSettingsAudioPanel(view: SettingsView, actions: AppActions): HTMLElement {
  const mix = createBootSettingsPanel("audio-mix", "ui.boot.settings.panel.audioMix");
  const notifications = createBootSettingsPanel(
    "notifications",
    "ui.boot.settings.panel.notifications"
  );
  mix.append(
    createBootToggleRow("ui.settings.sound", view.sound, actions.changeSound, "sound"),
    createBootRangeControlRow("ui.settings.volume", view.volume, actions.changeVolume, "volume"),
    createBootCycleRow("ui.boot.settings.outputBus", [
      t("ui.boot.settings.outputBusValue"),
      t("ui.boot.settings.outputBusHeadphones"),
      t("ui.boot.settings.outputBusMonitor")
    ])
  );
  notifications.append(
    createBootToggleRow(
      "ui.settings.doNotDisturb",
      view.doNotDisturb,
      actions.changeDoNotDisturb,
      "doNotDisturb"
    ),
    createBootToggleRow("ui.boot.settings.uiBleeps", view.sound, actions.changeSound, "sound"),
    createBootToggleRow(
      "ui.boot.settings.messagePulse",
      !view.doNotDisturb,
      (enabled) => {
        actions.changeDoNotDisturb(!enabled);
      },
      "messagePulse"
    )
  );

  const root = el("div", { className: "boot-settings__panels" });
  root.dataset.tabPanel = "audio";
  root.append(mix, notifications);
  return root;
}

function createBootSettingsGameplayPanel(view: SettingsView, actions: AppActions): HTMLElement {
  const run = createBootSettingsPanel("run", "ui.boot.settings.panel.run");
  const flow = createBootSettingsPanel("flow", "ui.boot.settings.panel.flow");
  let notation = view.notation;
  const langValue = text(view.lang.toUpperCase());
  const langRow = createBootInfoRow("ui.settings.language", "");
  langRow.dataset.bootSetting = "language";
  langRow
    .querySelector<HTMLElement>(".boot-settings__row-label")
    ?.setAttribute("data-boot-lang-label", "1");
  const langOutput = langRow.querySelector<HTMLElement>(".boot-settings__row-value");
  langOutput?.replaceChildren(langValue);
  langOutput?.setAttribute("data-boot-lang-value", "1");
  langRow.addEventListener("click", () => {
    actions.changeLang(langValue.data.toLowerCase() === "en" ? "pl" : "en");
  });
  const notationRow = createBootInfoRow("ui.settings.notation", getNotationLabel(notation));
  notationRow.dataset.bootSetting = "notation";
  notationRow.dataset.notation = notation;
  const notationOutput = notationRow.querySelector<HTMLElement>(".boot-settings__row-value");
  notationRow.addEventListener("click", () => {
    notation = notationRow.dataset.notation === "sci" ? "suffix" : "sci";
    notationRow.dataset.notation = notation;
    if (notationOutput !== null) {
      notationOutput.textContent = getNotationLabel(notation);
    }
    actions.changeNotation(notation);
  });
  run.append(langRow, notationRow, createBootAutosaveRow(view.autosaveS, actions.changeAutosaveS));
  flow.append(
    createBootToggleRow(
      "ui.settings.skipIntro",
      view.skipIntro,
      actions.changeSkipIntro,
      "skipIntro"
    ),
    createBootToggleRow("ui.settings.glitch", view.glitch, actions.changeGlitch, "glitch"),
    createBootToggleRow(
      "ui.settings.reducedFx",
      view.reducedFx,
      actions.changeReducedFx,
      "reducedFx"
    ),
    createBootToggleRow(
      "ui.settings.vibexLocalAi",
      view.vibexLocalAi,
      actions.changeVibexLocalAi,
      "vibexLocalAi"
    )
  );

  const root = el("div", { className: "boot-settings__panels" });
  root.dataset.tabPanel = "gameplay";
  root.append(run, flow);
  return root;
}

function createBootSettingsPanel(modifier: string, titleKey: string): HTMLElement {
  const panel = el("section", {
    className: `boot-settings__panel boot-settings__panel--${modifier}`
  });
  const title = el("h3", { className: "boot-settings__panel-title" });
  title.append(text(t(titleKey)));
  panel.append(title);
  return panel;
}

function createBootSettingsAction(labelKey: string): HTMLButtonElement {
  const button = el("button", { className: "boot-settings__action", title: t(labelKey) });
  button.type = "button";
  button.append(text(t(labelKey)));
  return button;
}

function createBootSettingsTab(labelKey: string): HTMLButtonElement {
  const button = el("button", { className: "boot-settings__tab", title: t(labelKey) });
  button.type = "button";
  button.setAttribute("role", "tab");
  button.append(text(t(labelKey)));
  return button;
}

function createBootInfoRow(labelKey: string, value: string): HTMLButtonElement {
  const row = el("button", {
    className: "boot-settings__row boot-settings__row--info",
    title: t(labelKey)
  });
  row.type = "button";
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t(labelKey)));
  const output = el("span", { className: "boot-settings__row-value" });
  output.append(text(value));
  row.append(label, output);
  return row;
}

function createBootToggleRow(
  labelKey: string,
  checked: boolean,
  onChange: (enabled: boolean) => void,
  syncKey?: string
): HTMLButtonElement {
  const row = createBootInfoRow(labelKey, "");
  row.classList.remove("boot-settings__row--info");
  if (syncKey !== undefined) {
    row.dataset.bootToggle = syncKey;
  }
  const value = row.querySelector<HTMLElement>(".boot-settings__row-value");
  const track = el("span", { className: "boot-settings__toggle-track" });
  const knob = el("span", { className: "boot-settings__toggle-knob" });
  track.setAttribute("aria-hidden", "true");
  knob.setAttribute("aria-hidden", "true");
  track.append(knob);

  row.append(track);
  row.addEventListener("click", () => {
    const enabled = row.getAttribute("aria-pressed") !== "true";
    setBootToggleRow(row, enabled, value);
    onChange(enabled);
  });
  setBootToggleRow(row, checked, value);
  return row;
}

function setBootToggleRow(
  row: HTMLElement,
  enabled: boolean,
  value = row.querySelector<HTMLElement>(".boot-settings__row-value")
): void {
  row.classList.toggle("boot-settings__row--on", enabled);
  row.setAttribute("aria-pressed", String(enabled));
  if (value !== null) {
    value.textContent = t(enabled ? "ui.boot.settings.on" : "ui.boot.settings.off");
  }
}

function createBootCycleRow(labelKey: string, values: readonly string[]): HTMLButtonElement {
  const row = createBootInfoRow(labelKey, values[0] ?? "");
  row.dataset.bootCycleIndex = "0";
  row.addEventListener("click", () => {
    const current = Number(row.dataset.bootCycleIndex ?? "0");
    const next = values.length === 0 ? 0 : (current + 1) % values.length;
    row.dataset.bootCycleIndex = String(next);
    const output = row.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null) {
      output.textContent = values[next] ?? "";
    }
  });
  return row;
}

function createBootRangeControlRow(
  labelKey: string,
  value: string,
  onChange: (value: number) => void,
  syncKey?: string
): HTMLElement {
  const row = el("label", { className: "boot-settings__row boot-settings__row--range" });
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t(labelKey)));
  const input = el("input", { className: "boot-settings__range" });
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = "0.01";
  input.value = value;
  if (syncKey !== undefined) {
    input.dataset.bootRange = syncKey;
  }
  const output = el("span", { className: "boot-settings__row-value" });
  input.addEventListener("input", () => {
    const nextValue = Number(input.value);
    if (Number.isFinite(nextValue)) {
      setBootRangeValue(input, output, input.value);
      onChange(nextValue);
    }
  });
  setBootRangeValue(input, output, value);
  row.append(label, input, output);
  return row;
}

function setBootRangeValue(input: HTMLInputElement, output: HTMLElement, value: string): void {
  input.value = value;
  const percentage = Math.round(Number(input.value) * 100);
  output.textContent = String(percentage);
  input.style.setProperty("--range-value", `${percentage}%`);
}

function createBootUiScaleRow(settingsRoot: HTMLElement): HTMLElement {
  const row = el("label", { className: "boot-settings__row boot-settings__row--range" });
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t("ui.boot.settings.uiScale")));
  const input = el("input", { className: "boot-settings__range" });
  input.type = "range";
  input.min = "0.9";
  input.max = "1.1";
  input.step = "0.05";
  input.value = "1";
  input.dataset.bootUiScale = "1";
  const output = el("span", { className: "boot-settings__row-value" });
  const sync = (): void => {
    const scale = Number(input.value);
    const nextScale = Number.isFinite(scale) ? scale : 1;
    const percentage = Math.round(nextScale * 100);
    settingsRoot.style.setProperty("--boot-settings-scale", String(nextScale));
    input.style.setProperty("--range-value", `${Math.round((nextScale - 0.9) * 500)}%`);
    output.textContent = t("ui.boot.settings.uiScaleValue", { value: String(percentage) });
  };
  input.addEventListener("input", sync);
  sync();
  row.append(label, input, output);
  return row;
}

function createBootThemeChoices(settingsRoot: HTMLElement): HTMLElement {
  const choices = el("div", { className: "boot-settings__themes" });
  for (const theme of ["crt", "violet", "amber"] as readonly BootVisualTheme[]) {
    const item = el("button", {
      className: `boot-settings__theme boot-settings__theme--${theme}`,
      title: t(`ui.boot.settings.theme.${theme}`)
    });
    item.type = "button";
    item.dataset.bootTheme = theme;
    item.classList.toggle("boot-settings__theme--active", theme === "crt");
    item.addEventListener("click", () => {
      setBootVisualTheme(settingsRoot, theme);
    });
    const swatch = el("span", { className: "boot-settings__theme-swatch" });
    swatch.setAttribute("aria-hidden", "true");
    const label = el("span", { className: "boot-settings__theme-label" });
    label.append(text(t(`ui.boot.settings.theme.${theme}`)));
    item.append(swatch, label);
    choices.append(item);
  }
  setBootVisualTheme(settingsRoot, "crt");
  return choices;
}

function createBootAutosaveRow(value: string, onChange: (seconds: number) => void): HTMLElement {
  const row = el("label", { className: "boot-settings__row boot-settings__row--number" });
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t("ui.settings.autosave")));
  const input = el("input", { className: "boot-settings__number" });
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = value;
  input.dataset.bootNumber = "autosaveS";
  const output = el("span", { className: "boot-settings__row-value" });
  let lastValidValue = value;
  const syncOutput = (): void => {
    output.textContent = t("ui.boot.settings.seconds", { seconds: input.value });
  };
  const commit = (repairInvalid: boolean): void => {
    const seconds = Number(input.value);
    if (Number.isFinite(seconds) && seconds > 0) {
      input.value = String(Math.round(seconds));
      lastValidValue = input.value;
      syncOutput();
      onChange(Number(input.value));
      return;
    }

    if (repairInvalid) {
      input.value = lastValidValue;
      syncOutput();
    }
  };
  input.addEventListener("input", () => {
    commit(false);
  });
  input.addEventListener("change", () => {
    commit(true);
  });
  syncOutput();
  row.append(label, input, output);
  return row;
}

function setBootVisualTheme(settingsRoot: HTMLElement, theme: BootVisualTheme): void {
  settingsRoot.dataset.theme = theme;
  settingsRoot
    .querySelectorAll<HTMLElement>("[data-boot-theme]")
    .forEach((item) =>
      item.classList.toggle("boot-settings__theme--active", item.dataset.bootTheme === theme)
    );
}

function resetBootVisualSettings(settingsRoot: HTMLElement): void {
  setBootVisualTheme(settingsRoot, "crt");
  settingsRoot.style.setProperty("--boot-settings-scale", "1");
  const scaleInput = settingsRoot.querySelector<HTMLInputElement>("[data-boot-ui-scale]");
  if (scaleInput !== null) {
    scaleInput.value = "1";
    scaleInput.dispatchEvent(new window.Event("input"));
  }
}

function syncBootSettings(root: HTMLElement, view: SettingsView): void {
  syncBootToggleRows(root, "doNotDisturb", view.doNotDisturb);
  syncBootToggleRows(root, "glitch", view.glitch);
  syncBootToggleRows(root, "messagePulse", !view.doNotDisturb);
  syncBootToggleRows(root, "reducedFx", view.reducedFx);
  syncBootToggleRows(root, "skipIntro", view.skipIntro);
  syncBootToggleRows(root, "sound", view.sound);
  syncBootToggleRows(root, "vibexLocalAi", view.vibexLocalAi);
  syncBootRangeRows(root, "volume", view.volume);
  syncBootNumberRows(root, "autosaveS", view.autosaveS);
  syncBootNotationRow(root, view.notation);
}

function syncBootToggleRows(root: HTMLElement, key: string, enabled: boolean): void {
  root.querySelectorAll<HTMLElement>(`[data-boot-toggle="${key}"]`).forEach((row) => {
    setBootToggleRow(row, enabled);
  });
}

function syncBootRangeRows(root: HTMLElement, key: string, value: string): void {
  root.querySelectorAll<HTMLInputElement>(`[data-boot-range="${key}"]`).forEach((input) => {
    const output = input
      .closest(".boot-settings__row")
      ?.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null && output !== undefined && document.activeElement !== input) {
      setBootRangeValue(input, output, value);
    }
  });
}

function syncBootNumberRows(root: HTMLElement, key: string, value: string): void {
  root.querySelectorAll<HTMLInputElement>(`[data-boot-number="${key}"]`).forEach((input) => {
    if (document.activeElement === input) {
      return;
    }

    input.value = value;
    const output = input
      .closest(".boot-settings__row")
      ?.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null && output !== undefined) {
      output.textContent = t("ui.boot.settings.seconds", { seconds: value });
    }
  });
}

function syncBootNotationRow(root: HTMLElement, notation: SettingsNotation): void {
  root.querySelectorAll<HTMLButtonElement>('[data-boot-setting="notation"]').forEach((row) => {
    row.dataset.notation = notation;
    const output = row.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null) {
      output.textContent = getNotationLabel(notation);
    }
  });
}

function isBrowserFullscreen(): boolean {
  return document.fullscreenElement !== null && document.fullscreenElement !== undefined;
}

function getNotationLabel(notation: SettingsNotation): string {
  return t(notation === "sci" ? "ui.settings.notationSci" : "ui.settings.notationSuffix");
}

async function enterBrowserFullscreen(): Promise<void> {
  if (!isBrowserFullscreen() && document.documentElement.requestFullscreen !== undefined) {
    await document.documentElement.requestFullscreen();
  }
}

async function exitBrowserFullscreen(): Promise<void> {
  if (isBrowserFullscreen() && document.exitFullscreen !== undefined) {
    await document.exitFullscreen();
  }
}

function createBootCredits(): HTMLElement {
  const credits = el("p", { className: "boot-panel__copy" });
  credits.append(text(t("ui.boot.creditsCopy")));
  return credits;
}

function createDesktop(
  view: DevFloorView,
  counters: ResourceCounterSet,
  screens: ScreenNodes,
  vibex: VibexNodes,
  vibexModel: HTMLElement,
  comms: Record<CommsChannel, CommsNodes>,
  actions: AppActions
): DesktopNodes {
  const root = el("section", { className: "desktop" });
  const wallpaper = el("div", { className: "desktop__wallpaper" });
  const icons = createDesktopIcons(actions);
  const windowsLayer = el("section", { className: "desktop__windows" });
  const notes = createStickyNotes(counters);
  const taskbar = createTaskbar(actions);
  const tutorial = createTutorialOverlay(view.tutorial, actions);
  const desktop: DesktopNodes = {
    currentScene: view.ui.scene,
    currentWindows: view.ui.windows,
    iconNodes: icons.nodes,
    root,
    taskbarNodes: taskbar,
    tutorialNodes: tutorial,
    windowNodes: {} as Record<AppId, WindowNodes>,
    windowsLayer
  };

  for (const appId of APP_IDS) {
    const content = getWindowContent(appId, screens, vibex, vibexModel, comms);
    const windowNodes = createWindow(appId, content, view, desktop, actions);
    desktop.windowNodes[appId] = windowNodes;
    windowsLayer.append(windowNodes.root);
  }

  root.append(wallpaper, icons.root, windowsLayer, notes, taskbar.root, tutorial.root);
  updateDesktop(desktop, view);
  return desktop;
}

function createDesktopIcons(actions: AppActions): {
  readonly nodes: Record<AppId, DesktopIconNodes>;
  readonly root: HTMLElement;
} {
  const root = el("nav", {
    ariaLabel: t("ui.desktop.ariaLabel"),
    className: "desktop-icons"
  });
  const nodes = {} as Record<AppId, DesktopIconNodes>;

  for (const link of screenLinks) {
    const label = t(link.key);
    const button = el("button", {
      ariaLabel: label,
      className: "desktop-icon",
      title:
        link.shortcut === undefined
          ? label
          : t("ui.desktop.iconTitle", { key: link.shortcut, label })
    });
    button.dataset.appId = link.appId;
    const iconLabel = el("span", { className: "desktop-icon__label" });
    const badge = el("span", { className: "desktop-icon__badge" });
    button.type = "button";
    badge.hidden = true;
    iconLabel.append(text(label));
    button.append(createAppIcon(link), iconLabel, badge);
    button.addEventListener("click", () => {
      actions.openApp(link.appId, getViewportWindowBounds());
    });
    root.append(button);
    nodes[link.appId] = { badge, button, label };
  }

  return { nodes, root };
}

function createTaskbar(actions: AppActions): TaskbarNodes {
  const root = el("nav", {
    ariaLabel: t("ui.taskbar.ariaLabel"),
    className: "taskbar"
  });
  const items = {} as Record<AppId, TaskbarItemNodes>;

  for (const link of screenLinks) {
    const label = t(link.key);
    const button = el("button", {
      ariaLabel: label,
      className: "taskbar-item",
      title: label
    });
    button.type = "button";
    button.dataset.appId = link.appId;
    button.hidden = true;
    const labelNode = el("span", { className: "taskbar-item__label" });
    labelNode.append(text(label));
    button.append(createAppIcon(link), labelNode);
    button.addEventListener("click", () => {
      actions.openApp(link.appId, getViewportWindowBounds());
    });
    root.append(button);
    items[link.appId] = { button, label };
  }

  return { items, root };
}

function createTutorialOverlay(view: TutorialView, actions: AppActions): TutorialNodes {
  const root = el("section", {
    ariaLabel: t("ui.tutorial.ariaLabel"),
    className: "tutorial-overlay"
  });
  const card = el("article", { className: "tutorial-card" });
  const progress = text("");
  const progressNode = el("span", { className: "tutorial-card__progress" });
  progressNode.append(progress);
  const title = text("");
  const titleNode = el("h2", { className: "tutorial-card__title" });
  titleNode.append(title);
  const body = text("");
  const bodyNode = el("p", { className: "tutorial-card__body" });
  bodyNode.append(body);
  const actionsRow = el("div", { className: "tutorial-card__actions" });
  const back = createTutorialButton("ui.tutorial.back", actions.tutorialBack);
  const skip = createTutorialButton("ui.tutorial.skip", actions.tutorialSkip);
  const next = createTutorialButton("ui.tutorial.next", actions.tutorialNext);
  const finish = createTutorialButton("ui.tutorial.finish", actions.tutorialNext);
  next.classList.add("tutorial-card__button--primary");
  finish.classList.add("tutorial-card__button--primary");
  actionsRow.append(back, skip, next, finish);
  card.append(progressNode, titleNode, bodyNode, actionsRow);
  root.append(card);

  const nodes = { back, body, finish, next, progress, root, skip, title };
  updateTutorialOverlay(nodes, view);
  return nodes;
}

function createTutorialButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "tutorial-card__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function updateTutorialOverlay(nodes: TutorialNodes, view: TutorialView): void {
  nodes.root.hidden = !view.active;

  if (!view.active) {
    delete nodes.root.dataset.step;
    return;
  }

  nodes.root.dataset.step = view.step;
  setText(
    nodes.progress,
    t("ui.tutorial.progress", { current: view.index + 1, total: view.total })
  );
  setText(nodes.title, t(`ui.tutorial.${view.step}.title`));
  setText(nodes.body, t(`ui.tutorial.${view.step}.body`));
  nodes.back.disabled = view.index === 0;
  nodes.next.hidden = view.step === "done";
  nodes.skip.hidden = view.step === "done";
  nodes.finish.hidden = view.step !== "done";
  setTextContent(nodes.back, t("ui.tutorial.back"));
  setTextContent(nodes.next, t("ui.tutorial.next"));
  setTextContent(nodes.skip, t("ui.tutorial.skip"));
  setTextContent(nodes.finish, t("ui.tutorial.finish"));
}

function createStickyNotes(counters: ResourceCounterSet): HTMLElement {
  const notes = el("aside", {
    ariaLabel: t("ui.notes.ariaLabel"),
    className: "sticky-notes"
  });
  notes.append(
    createStickyNote("sticky-note--money", [
      createResourceCounter("ui.resource.money", counters.money),
      createResourceCounter("ui.notes.moneyRate", counters.moneyRate)
    ]),
    createStickyNote("sticky-note--loc", [
      createResourceCounter("ui.resource.loc", counters.loc),
      createResourceCounter("ui.resource.locRate", counters.locRate),
      createNoteFootnote("ui.notes.locDefinition")
    ]),
    createStickyNote("sticky-note--system", [
      createResourceCounter("ui.resource.rp", counters.rp),
      createResourceCounter("ui.resource.compute", counters.compute),
      createResourceCounter("ui.resource.hype", counters.hype)
    ])
  );
  return notes;
}

function createStickyNote(className: string, children: readonly HTMLElement[]): HTMLElement {
  const note = el("section", { className: `sticky-note ${className}` });
  note.append(...children);
  return note;
}

function createNoteFootnote(labelKey: string): HTMLElement {
  const footnote = el("span", { className: "sticky-note__footnote" });
  footnote.append(text(t(labelKey)));
  return footnote;
}

function getWindowContent(
  appId: AppId,
  screens: ScreenNodes,
  vibex: VibexNodes,
  vibexModel: HTMLElement,
  comms: Record<CommsChannel, CommsNodes>
): HTMLElement {
  switch (appId) {
    case "vibex": {
      const content = el("section", { className: "vibex-window" });
      content.append(vibexModel, vibex.root);
      return content;
    }
    case "agents":
      return screens.agents;
    case "hardware":
      return screens.hardware;
    case "upgrades":
      return screens.upgrades;
    case "projects":
      return screens.projects;
    case "aurora":
      return screens.aurora;
    case "research":
      return screens.research;
    case "rewrite":
      return screens.rewrite;
    case "stats":
      return screens.stats;
    case "achievements":
      return screens.achievements;
    case "chat":
      return comms.chat.root;
    case "mail":
      return comms.mail.root;
    case "feed":
      return comms.feed.root;
    case "settings":
      return screens.settings;
  }
}

function createWindow(
  appId: AppId,
  content: HTMLElement,
  view: DevFloorView,
  desktop: DesktopNodes,
  actions: AppActions
): WindowNodes {
  const root = el("section", { className: "desktop-window" });
  root.dataset.appId = appId;
  const titlebar = el("header", { className: "desktop-window__titlebar" });
  const titleWrap = el("div", { className: "desktop-window__title" });
  const link = screenLinks.find((entry) => entry.appId === appId);
  if (link !== undefined) {
    titleWrap.append(createAppIcon(link));
  }
  const title = text(getWindowTitle(appId, view));
  titleWrap.append(title);
  const controls = el("div", { className: "desktop-window__controls" });
  controls.append(
    createWindowControl("ui.window.minimize", "ui.window.minimizeGlyph", () => {
      actions.minimizeApp(appId);
    }),
    createWindowControl("ui.window.maximize", "ui.window.maximizeGlyph", () => {
      actions.maximizeApp(appId, getDesktopBounds(desktop.windowsLayer));
    }),
    createWindowControl("ui.window.close", "ui.window.closeGlyph", () => {
      actions.closeApp(appId);
    })
  );
  titlebar.append(titleWrap, controls);
  titlebar.addEventListener("pointerdown", (event) => {
    beginWindowDrag(event, appId, root, desktop, actions);
  });

  const body = el("section", { className: "desktop-window__body" });
  body.append(content);
  root.addEventListener("pointerdown", (event) => {
    if (
      isInteractiveWindowTarget(event.target) ||
      getInteractiveWindowTargetAtPoint(body, event.clientX, event.clientY) !== undefined
    ) {
      return;
    }

    actions.focusApp(appId);
  });
  root.addEventListener("click", (event) => {
    if (isInteractiveWindowTarget(event.target)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target !== root && target !== body && !content.contains(target)) {
      return;
    }

    const control = getInteractiveWindowTargetAtPoint(body, event.clientX, event.clientY);
    if (control === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    activateWindowControl(control);
  });
  const resize = el("span", {
    ariaLabel: t("ui.window.resize"),
    className: "desktop-window__resize",
    title: t("ui.window.resize")
  });
  resize.addEventListener("pointerdown", (event) => {
    beginWindowResize(event, appId, root, desktop, actions);
  });

  root.append(titlebar, body, resize);
  return { content: body, hideTimer: undefined, root, title, wasVisible: false };
}

function createWindowControl(
  titleKey: string,
  glyphKey: string,
  onClick: () => void
): HTMLButtonElement {
  const button = el("button", {
    ariaLabel: t(titleKey),
    className: "desktop-window__control",
    title: t(titleKey)
  });
  button.type = "button";
  button.append(text(t(glyphKey)));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function updateDesktop(nodes: DesktopNodes, view: DevFloorView): void {
  nodes.currentScene = view.ui.scene;
  nodes.root.hidden = view.ui.scene !== "desktop";
  nodes.currentWindows = view.ui.windows;
  if (view.tutorial.active) {
    nodes.root.dataset.tutorialStep = view.tutorial.step;
  } else {
    delete nodes.root.dataset.tutorialStep;
  }
  updateTutorialOverlay(nodes.tutorialNodes, view.tutorial);
  updateDesktopWindows(nodes, view);
  updateDesktopIcons(nodes, view);
  updateTaskbar(nodes, view);
}

function updateVisibleCommsApps(
  nodes: Record<CommsChannel, CommsNodes>,
  view: DevFloorView,
  actions: AppActions
): void {
  for (const channel of ["chat", "mail", "feed"] as const) {
    if (isAppVisible(view.ui.windows, channel)) {
      updateComms(nodes[channel], view.comms, actions);
    }
  }
}

function updateDesktopWindows(nodes: DesktopNodes, view: DevFloorView): void {
  const bounds = getDesktopBounds(nodes.windowsLayer);
  const activeZ = getTopVisibleZ(view.ui.windows);

  for (const appId of APP_IDS) {
    const windowState = view.ui.windows[appId];
    const node = nodes.windowNodes[appId];
    const visible = isWindowVisible(windowState) && isAppAvailable(view, appId);
    const minimizing = node.wasVisible && windowState.open && windowState.minimized && !visible;
    setText(node.title, getWindowTitle(appId, view));
    updateWindowVisibility(node, visible, minimizing, view.appearance.reducedFx);
    node.root.classList.toggle("desktop-window--maximized", windowState.maximized);
    node.root.classList.toggle("desktop-window--active", visible && windowState.z === activeZ);

    if (visible) {
      applyWindowFrame(node.root, getRenderedWindowFrame(windowState, bounds), windowState.z);
    }

    node.wasVisible = visible;
  }
}

function updateWindowVisibility(
  node: WindowNodes,
  visible: boolean,
  minimizing: boolean,
  reducedFx: boolean
): void {
  if (visible) {
    if (node.hideTimer !== undefined) {
      window.clearTimeout(node.hideTimer);
      node.hideTimer = undefined;
    }
    node.root.hidden = false;
    node.root.classList.remove("desktop-window--minimizing");
    return;
  }

  if (minimizing && !reducedFx) {
    if (node.hideTimer !== undefined) {
      window.clearTimeout(node.hideTimer);
    }
    node.root.hidden = false;
    node.root.classList.add("desktop-window--minimizing");
    node.hideTimer = window.setTimeout(() => {
      if (node.root.classList.contains("desktop-window--minimizing")) {
        node.root.hidden = true;
        node.root.classList.remove("desktop-window--minimizing");
      }
      node.hideTimer = undefined;
    }, 170);
    return;
  }

  if (node.hideTimer !== undefined) {
    window.clearTimeout(node.hideTimer);
    node.hideTimer = undefined;
  }
  node.root.hidden = true;
  node.root.classList.remove("desktop-window--minimizing");
}

function updateDesktopIcons(nodes: DesktopNodes, view: DevFloorView): void {
  for (const appId of APP_IDS) {
    const icon = nodes.iconNodes[appId];
    const available = isAppAvailable(view, appId);
    const channel = getCommsChannelForApp(appId);
    const unread = channel === undefined ? 0 : view.comms.unreadByChannel[channel];

    icon.button.hidden = !available;
    icon.badge.hidden = unread === 0;
    setTextContent(icon.badge, unread === 0 ? "" : String(unread));
    icon.button.classList.toggle(
      "desktop-icon--pulse",
      unread > 0 && !view.settings.doNotDisturb && !view.appearance.reducedFx
    );
    icon.button.classList.toggle(
      "desktop-icon--glitch",
      view.appearance.glitch && !view.appearance.reducedFx
    );
    icon.button.setAttribute(
      "aria-label",
      unread === 0 ? icon.label : t("ui.desktop.unreadBadge", { count: unread, label: icon.label })
    );
  }
}

function updateTaskbar(nodes: DesktopNodes, view: DevFloorView): void {
  const activeZ = getTopVisibleZ(view.ui.windows);

  for (const appId of APP_IDS) {
    const item = nodes.taskbarNodes.items[appId];
    const windowState = view.ui.windows[appId];
    const available = isAppAvailable(view, appId);
    const open = windowState.open;
    const visible = isWindowVisible(windowState) && available;

    item.button.hidden = !open || !available;
    item.button.classList.toggle("taskbar-item--active", visible && windowState.z === activeZ);
    item.button.classList.toggle("taskbar-item--minimized", open && windowState.minimized);
    item.button.classList.toggle(
      "taskbar-item--glitch",
      open && view.appearance.glitch && !view.appearance.reducedFx
    );
    item.button.setAttribute(
      "aria-label",
      open && windowState.minimized
        ? t("ui.taskbar.restoreLabel", { label: item.label })
        : item.label
    );
  }
}

function isAppAvailable(view: DevFloorView, appId: AppId): boolean {
  return appId !== "aurora" || view.aurora.unlocked;
}

function getWindowTitle(appId: AppId, view: DevFloorView): string {
  if (appId === "vibex") {
    return t("ui.window.vibexTitle", { model: view.model.current });
  }

  return t(`ui.app.${appId}`);
}

function getCommsChannelForApp(appId: AppId): CommsChannel | undefined {
  if (appId === "chat" || appId === "mail" || appId === "feed") {
    return appId;
  }

  return undefined;
}

function beginWindowDrag(
  event: PointerEvent,
  appId: AppId,
  root: HTMLElement,
  desktop: DesktopNodes,
  actions: AppActions
): void {
  if (
    event.button !== 0 ||
    (event.target instanceof HTMLElement && event.target.closest("button"))
  ) {
    return;
  }

  const windowState = desktop.currentWindows[appId];
  if (windowState.maximized) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  actions.focusApp(appId);

  const activeWindowState = desktop.currentWindows[appId];
  const bounds = getDesktopBounds(desktop.windowsLayer);
  const startFrame = getRenderedWindowFrame(activeWindowState, bounds);
  const startX = event.clientX;
  const startY = event.clientY;
  let nextFrame: WindowFrame = startFrame;
  let active = true;
  const captureTarget = getPointerCaptureTarget(event);

  root.classList.add("desktop-window--dragging");
  capturePointer(captureTarget, event.pointerId);

  const move = (moveEvent: PointerEvent): void => {
    nextFrame = getRenderedWindowFrame(
      {
        ...activeWindowState,
        ...startFrame,
        maximized: false,
        x: startFrame.x + moveEvent.clientX - startX,
        y: startFrame.y + moveEvent.clientY - startY
      },
      bounds
    );
    applyWindowFrame(root, nextFrame, activeWindowState.z);
  };
  const end = (): void => {
    if (!active) {
      return;
    }

    active = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    window.removeEventListener("blur", end);
    captureTarget?.removeEventListener("lostpointercapture", end);
    releasePointer(captureTarget, event.pointerId);
    root.classList.remove("desktop-window--dragging");
    actions.moveApp(appId, { x: nextFrame.x, y: nextFrame.y }, bounds);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  window.addEventListener("blur", end);
  captureTarget?.addEventListener("lostpointercapture", end);
}

function beginWindowResize(
  event: PointerEvent,
  appId: AppId,
  root: HTMLElement,
  desktop: DesktopNodes,
  actions: AppActions
): void {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  actions.focusApp(appId);
  const bounds = getDesktopBounds(desktop.windowsLayer);
  const windowState = desktop.currentWindows[appId];
  const startFrame = getRenderedWindowFrame(windowState, bounds);
  const startX = event.clientX;
  const startY = event.clientY;
  let nextFrame: WindowFrame = startFrame;
  let active = true;
  const captureTarget = getPointerCaptureTarget(event);

  capturePointer(captureTarget, event.pointerId);

  const move = (moveEvent: PointerEvent): void => {
    nextFrame = {
      ...startFrame,
      h: startFrame.h + moveEvent.clientY - startY,
      w: startFrame.w + moveEvent.clientX - startX
    };
    applyWindowFrame(
      root,
      getRenderedWindowFrame({ ...windowState, ...nextFrame }, bounds),
      windowState.z
    );
  };
  const end = (): void => {
    if (!active) {
      return;
    }

    active = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    window.removeEventListener("blur", end);
    captureTarget?.removeEventListener("lostpointercapture", end);
    releasePointer(captureTarget, event.pointerId);
    actions.resizeApp(appId, nextFrame, bounds);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  window.addEventListener("blur", end);
  captureTarget?.addEventListener("lostpointercapture", end);
}

function getPointerCaptureTarget(event: PointerEvent): HTMLElement | undefined {
  return event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
}

function capturePointer(target: HTMLElement | undefined, pointerId: number): void {
  if (target === undefined) {
    return;
  }

  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Some test/browser surfaces expose pointer events without capture support.
  }
}

function releasePointer(target: HTMLElement | undefined, pointerId: number): void {
  if (target === undefined) {
    return;
  }

  try {
    target.releasePointerCapture(pointerId);
  } catch {
    // Pointer capture can already be released by the browser.
  }
}

function applyWindowFrame(root: HTMLElement, frame: WindowFrame, z: number): void {
  root.style.transform = `translate3d(${frame.x.toFixed(0)}px, ${frame.y.toFixed(0)}px, 0)`;
  root.style.width = `${frame.w.toFixed(0)}px`;
  root.style.height = `${frame.h.toFixed(0)}px`;
  root.style.zIndex = String(z);
}

function getRenderedWindowFrame(windowState: WindowState, bounds: WindowBounds): WindowFrame {
  const copy: WindowState = {
    ...windowState,
    restore: windowState.restore === undefined ? undefined : { ...windowState.restore }
  };
  clampWindow(copy, bounds);
  return { h: copy.h, w: copy.w, x: copy.x, y: copy.y };
}

function getDesktopBounds(layer: HTMLElement): WindowBounds {
  const rect = layer.getBoundingClientRect();
  const fallbackWidth = window.innerWidth || 1280;
  const fallbackHeight = Math.max(1, (window.innerHeight || 800) - 112);
  return {
    height: Math.max(1, rect.height || fallbackHeight),
    width: Math.max(1, rect.width || fallbackWidth)
  };
}

function getViewportWindowBounds(): WindowBounds {
  return {
    height: Math.max(1, (window.innerHeight || 800) - 112),
    width: Math.max(1, window.innerWidth || 1280)
  };
}

function isAppVisible(windows: Record<AppId, WindowState>, appId: AppId): boolean {
  return isWindowVisible(windows[appId]);
}

function getTopVisibleZ(windows: Record<AppId, WindowState>): number {
  return Math.max(
    0,
    ...APP_IDS.map((appId) => (isWindowVisible(windows[appId]) ? windows[appId].z : 0))
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function createResourceCounters(resources: ResourceView): ResourceCounterSet {
  return {
    compute: createResourceCounterNodes(resources.compute),
    hype: createResourceCounterNodes(resources.hype),
    loc: createResourceCounterNodes(resources.loc),
    locRate: createResourceCounterNodes(resources.locRate, resources.locRateTooltip),
    money: createResourceCounterNodes(resources.money),
    moneyRate: createResourceCounterNodes(resources.moneyRate, resources.moneyRateTooltip),
    rp: createResourceCounterNodes(resources.rp)
  };
}

function createResourceCounterNodes(value: string, title = ""): ResourceCounterNodes {
  const root = el("div", { className: "resource-counter", title });
  return { root, value: text(value) };
}

function updateResourceCounters(counters: ResourceCounterSet, resources: ResourceView): void {
  setText(counters.compute.value, resources.compute);
  setText(counters.hype.value, resources.hype);
  setText(counters.loc.value, resources.loc);
  setText(counters.locRate.value, resources.locRate);
  counters.locRate.root.title = resources.locRateTooltip;
  setText(counters.money.value, resources.money);
  setText(counters.moneyRate.value, resources.moneyRate);
  counters.moneyRate.root.title = resources.moneyRateTooltip;
  setText(counters.rp.value, resources.rp);
}

function updateModel(view: ModelView): void {
  if (modelNodes === undefined) {
    return;
  }

  setText(modelNodes.value, view.current);
  setText(modelNodes.status, view.status);
  setText(modelNodes.cost, view.nextCost);
  modelNodes.button.disabled = !view.canBuy;
  modelNodes.button.hidden = view.maxed;
}

function createModelPanel(view: ModelView, actions: AppActions): HTMLElement {
  const panel = el("aside", { className: "model-panel" });
  const label = el("span", { className: "model-panel__label" });
  label.append(text(t("ui.model.label")));

  const value = el("strong", { className: "model-panel__value" });
  const valueText = text(view.current);
  value.append(valueText);

  const status = text(view.status);
  const statusNode = el("span", { className: "model-panel__status" });
  statusNode.append(status);
  const cost = text(view.nextCost);
  const costNode = el("span", { className: "model-panel__cost" });
  costNode.append(cost);
  const button = createBuyButton("ui.model.upgrade", actions.buyEra);
  panel.append(label, value, statusNode, costNode, button);
  modelNodes = { button, cost, status, value: valueText };
  updateModel(view);
  return panel;
}

function createScreens(view: DevFloorView, actions: AppActions): ScreenNodes {
  const agents = createAgentsScreen(view, actions);
  const hardwareScreen = createHardwareScreen(view.hardware, view.aurora, actions);
  const upgradesScreen = createUpgradesScreen(view.upgrades, actions);
  const projectsScreen = createProjectsScreen(view.projects, actions);
  const auroraScreen = createAuroraScreen(view.aurora, actions);
  const researchScreen = createResearchScreen(view.research, actions);
  const rewriteScreen = createRewriteScreen(view.rewrite, actions);
  const statsScreen = createStatsScreen(view.stats);
  const achievementsScreen = createAchievementsScreen(view.achievements);
  const settingsScreen = createSettingsScreen(view.settings, actions);
  return {
    achievements: achievementsScreen,
    agents,
    aurora: auroraScreen,
    hardware: hardwareScreen,
    projects: projectsScreen,
    research: researchScreen,
    rewrite: rewriteScreen,
    settings: settingsScreen,
    stats: statsScreen,
    upgrades: upgradesScreen
  };
}

interface ScreenNodes {
  readonly achievements: HTMLElement;
  readonly agents: HTMLElement;
  readonly aurora: HTMLElement;
  readonly hardware: HTMLElement;
  readonly projects: HTMLElement;
  readonly research: HTMLElement;
  readonly rewrite: HTMLElement;
  readonly settings: HTMLElement;
  readonly stats: HTMLElement;
  readonly upgrades: HTMLElement;
}

function updateAppearance(shell: HTMLElement, terminal: HTMLElement, view: AppearanceView): void {
  for (const className of endingClasses) {
    shell.classList.remove(className);
  }

  for (const className of terminalThemeClasses) {
    terminal.classList.remove(className);
  }

  if (view.ending !== undefined) {
    shell.classList.add(`app-shell--ending-${view.ending}`);
  }

  shell.classList.toggle("app-shell--glitch", view.glitch);
  shell.classList.toggle("app-shell--reduced-motion", view.reducedFx);

  if (view.theme !== undefined) {
    terminal.classList.add(`terminal--theme-${view.theme}`);
  }

  if (view.glitch) {
    terminal.classList.add("terminal--theme-glitch");
  }
}

function createAgentsScreen(view: DevFloorView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.agents")));

  const fullGame = createFullGamePanel(view.fullGame, actions);
  const compute = createComputeBreakdown(view.compute);
  const agentList = el("section", { className: "agent-list" });
  const header = el("div", { className: "agent-list__header" });
  header.append(
    createColumnLabel("ui.devfloor.agent"),
    createColumnLabel("ui.devfloor.owned"),
    createColumnLabel("ui.devfloor.rate"),
    createColumnLabel("ui.devfloor.cost"),
    createColumnLabel("ui.devfloor.milestone"),
    createColumnLabel("ui.devfloor.buy")
  );

  agentList.append(header);

  for (const generator of view.generators) {
    agentList.append(createGeneratorRow(generator, actions));
  }

  const automationTitle = el("h2", { className: "section-title" });
  automationTitle.append(text(t("ui.devfloor.automation")));
  const automationList = el("section", { className: "automation-list" });

  for (const rule of view.automation) {
    automationList.append(createAutomationToggle(rule, actions));
  }

  screen.append(title, fullGame, compute, agentList, automationTitle, automationList);
  return screen;
}

function createHardwareScreen(
  view: readonly HardwareRowView[],
  aurora: AuroraView,
  actions: AppActions
): HTMLElement {
  const screen = el("section", { className: "main-screen hardware-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.hardware")));
  const auroraCounter = createHardwareAuroraCounter(aurora);
  const pcRows = view.filter((hardware) => hardware.phase === "pc");
  const serverRows = view.filter((hardware) => hardware.phase === "server");
  const pcSection = createHardwareSection("pc", pcRows, actions);
  const serverSection = createHardwareSection("server", serverRows, actions);
  serverSection.hidden = serverRows.length === 0;

  screen.append(title, auroraCounter, pcSection, serverSection);
  return screen;
}

function createHardwareAuroraCounter(view: AuroraView): HTMLElement {
  const root = el("div", { className: "hardware-aurora-counter" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t("ui.hardware.auroraReady")));
  const value = text(view.readyServers);
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  root.append(label, output);
  hardwareAuroraCounterNodes = { root, value };
  updateHardwareAuroraCounter(view);
  return root;
}

function createHardwareSection(
  phase: HardwareRowView["phase"],
  rows: readonly HardwareRowView[],
  actions: AppActions
): HTMLElement {
  const section = el("section", { className: "hardware-section" });
  section.dataset.phase = phase;
  const title = el("h2", { className: "section-title hardware-section__title" });
  title.append(text(t(phase === "pc" ? "ui.hardware.pcTitle" : "ui.hardware.serverTitle")));
  const list = el("section", { className: "hardware-list" });
  list.dataset.phase = phase;

  for (const row of rows) {
    list.append(createHardwareRow(row, actions));
  }

  section.append(title, list);
  return section;
}

function createUpgradesScreen(view: readonly UpgradeRowView[], actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen upgrades-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.upgrades")));
  const upgradeList = el("section", { className: "upgrade-list" });

  for (const upgrade of view) {
    upgradeList.append(createUpgradeRow(upgrade, actions));
  }

  screen.append(title, upgradeList);
  return screen;
}

function createComputeBreakdown(view: ComputeBreakdownView): HTMLElement {
  const section = el("section", { className: "compute-breakdown" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.agents.compute")));
  const summary = el("div", { className: "compute-breakdown__summary" });
  const used = text(view.used);
  const cap = text(view.cap);
  const remaining = text(view.remaining);
  summary.append(
    createComputeMetric("ui.agents.computeUsed", used),
    createComputeMetric("ui.agents.computeCap", cap),
    createComputeMetric("ui.agents.computeRemaining", remaining)
  );

  const list = el("section", { className: "compute-breakdown__list" });
  for (const row of view.rows) {
    list.append(createComputeRow(row));
  }

  computeBreakdownNodes = { cap, list, remaining, used };
  section.append(title, summary, list);
  return section;
}

function createComputeMetric(labelKey: string, value: Text): HTMLElement {
  const metric = el("span", { className: "compute-breakdown__metric" });
  const label = el("span", { className: "compute-breakdown__label" });
  label.append(text(t(labelKey)));
  const number = el("strong", { className: "compute-breakdown__value" });
  number.append(value);
  metric.append(label, number);
  return metric;
}

function createComputeRow(view: ComputeRowView): HTMLElement {
  const root = el("div", { className: "compute-breakdown__row" });
  const name = text(view.name);
  const used = text(view.used);
  const nameNode = el("span", { className: "compute-breakdown__agent" });
  const usedNode = el("strong", { className: "compute-breakdown__used" });
  nameNode.append(name);
  usedNode.append(used);
  root.append(nameNode, usedNode);
  computeRows.set(view.id, { name, root, used });
  return root;
}

function createFullGamePanel(view: FullGameView, actions: AppActions): HTMLElement {
  const root = el("section", { className: "full-game-panel" });
  const title = el("h2", { className: "full-game-panel__title" });
  title.append(text(t("ui.demo.fullGameTitle")));
  const copy = el("p", { className: "full-game-panel__copy" });
  copy.append(text(t("ui.demo.fullGameCopy")));
  const exportArea = el("textarea", { className: "full-game-panel__textarea" });
  exportArea.readOnly = true;
  exportArea.placeholder = t("ui.demo.exportPlaceholder");
  const exportButton = createSettingsButton("ui.demo.exportSave", () => {
    exportArea.value = actions.exportSave();
    exportArea.select();
  });

  root.append(title, copy, exportArea, exportButton);
  fullGameNodes = { root };
  updateFullGame(view);
  return root;
}

function createProjectsScreen(view: ProjectsView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.projects")));

  const summary = el("div", { className: "project-summary" });
  summary.append(createSummaryItem("ui.projects.income", view.incomeRate));

  const refactor = createRefactorPanel(view.refactor, actions);
  const board = el("section", { className: "project-board" });

  for (const offer of view.offers) {
    board.append(createProjectOffer(offer, actions));
  }

  const activeTitle = el("h2", { className: "section-title" });
  activeTitle.append(text(t("ui.projects.active")));
  const activeList = el("section", { className: "active-build-list" });

  for (const build of view.activeBuilds) {
    activeList.append(createActiveBuild(build));
  }

  const portfolioTitle = el("h2", { className: "section-title" });
  portfolioTitle.append(text(t("ui.projects.portfolio")));
  const portfolioList = el("section", { className: "portfolio-list" });

  for (const product of view.portfolio) {
    portfolioList.append(createProduct(product, actions));
  }

  screen.append(
    title,
    summary,
    refactor,
    board,
    activeTitle,
    activeList,
    portfolioTitle,
    portfolioList
  );
  return screen;
}

function createAuroraScreen(view: AuroraView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen aurora-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.aurora")));

  const progressLabel = text(view.progressLabel);
  const progressBar = el("div", { className: "aurora-progress__bar" });
  const progressFill = el("div", { className: "aurora-progress__fill" });
  progressFill.style.transform = `scaleX(${view.progress.toFixed(3)})`;
  progressBar.append(progressFill);
  const progress = el("section", { className: "aurora-progress" });
  progress.append(progressLabel, progressBar);

  const phaseName = text(view.phaseName);
  const status = text(view.statusLabel);
  const costLoc = text(view.costLoc);
  const costMoney = text(view.costMoney);
  const timeRemaining = text(view.timeRemaining);
  const requiredServers = text(view.requiredServers);
  const availableServers = text(view.availableServers);
  const readyServers = text(view.readyServers);
  const dedicatedServers = text(view.dedicatedServers);
  const hostedServers = text(view.hostedServers);
  const hostingRate = text(view.hostingRate);

  const summary = el("section", { className: "aurora-summary" });
  summary.append(
    createProjectMeta("ui.aurora.phase", phaseName),
    createProjectMeta("ui.aurora.status", status),
    createProjectMeta("ui.aurora.costLoc", costLoc),
    createProjectMeta("ui.aurora.costMoney", costMoney),
    createProjectMeta("ui.aurora.time", timeRemaining),
    createProjectMeta("ui.aurora.requiredServers", requiredServers),
    createProjectMeta("ui.aurora.availableServers", availableServers),
    createProjectMeta("ui.aurora.readyServers", readyServers),
    createProjectMeta("ui.aurora.dedicatedServers", dedicatedServers),
    createProjectMeta("ui.aurora.hostedServers", hostedServers),
    createProjectMeta("ui.aurora.hostingRate", hostingRate)
  );

  const actionsRow = el("div", { className: "aurora-actions" });
  const fund = createProjectButton("ui.aurora.fund", actions.fundAuroraPhase);
  const dedicate = createProjectButton("ui.aurora.dedicateServer", actions.dedicateAuroraServer);
  const host = createProjectButton("ui.aurora.rentHost", actions.rentAuroraHost);
  actionsRow.append(fund, dedicate, host);

  const graphTitle = el("h2", { className: "section-title" });
  graphTitle.append(text(t("ui.aurora.graph")));
  const graph = el("section", { className: "aurora-graph" });
  for (const node of view.nodes) {
    graph.append(createAuroraNode(node));
  }

  auroraNodes = {
    availableServers,
    costLoc,
    costMoney,
    dedicate,
    dedicatedServers,
    fund,
    host,
    hostedServers,
    hostingRate,
    phaseName,
    progressBar: progressFill,
    progressLabel,
    readyServers,
    requiredServers,
    status,
    timeRemaining
  };
  updateAurora(view);

  screen.append(title, progress, summary, actionsRow, graphTitle, graph);
  return screen;
}

function createResearchScreen(view: ResearchView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen research-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.research")));

  const summary = el("div", { className: "research-summary" });
  summary.append(createSummaryBadge("ui.research.rp", view.rp));

  const tree = el("section", { className: "research-tree" });
  tree.append(createResearchConnections());

  for (const branch of ["throughput", "quality", "automation"]) {
    const column = el("section", { className: `research-branch research-branch--${branch}` });
    const branchTitle = el("h2", { className: "research-branch__title" });
    branchTitle.append(text(t(`ui.research.branch.${branch}`)));
    column.append(branchTitle);

    for (const node of view.nodes.filter((entry) => entry.branch === branch)) {
      column.append(createResearchNode(node, actions));
    }

    tree.append(column);
  }

  screen.append(title, summary, tree);
  return screen;
}

function createRewriteScreen(view: RewriteView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen rewrite-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.rewrite")));

  const bootOverlay = createRewriteBootOverlay();
  const forecast = el("section", { className: "rewrite-forecast" });
  const boot = el("p", { className: "rewrite-boot" });
  boot.append(text(t("ui.rewrite.booting")));
  const insight = text(view.insight);
  const gain = text(view.preview.gain);
  const requiredInsight = text(view.preview.requiredInsight);
  const afterInsight = text(view.preview.afterInsight);
  const currentMultiplier = text(view.preview.currentMultiplier);
  const targetMultiplier = text(view.preview.targetMultiplier);
  const speedup = text(view.preview.speedup);
  const startMoney = text(view.preview.startMoney);
  const startEra = text(view.preview.startEra);
  const startGenerators = text(view.preview.startGenerators);
  const button = createProjectButton("ui.rewrite.action", actions.rewrite);

  forecast.append(
    boot,
    createRewriteMeta("ui.rewrite.insight", insight),
    createRewriteMeta("ui.rewrite.gain", gain),
    createRewriteMeta("ui.rewrite.required", requiredInsight),
    createRewriteMeta("ui.rewrite.after", afterInsight),
    createRewriteMeta("ui.rewrite.currentMult", currentMultiplier),
    createRewriteMeta("ui.rewrite.nextMult", targetMultiplier),
    createRewriteMeta("ui.rewrite.speedup", speedup),
    createRewriteMeta("ui.rewrite.startMoney", startMoney),
    createRewriteMeta("ui.rewrite.startEra", startEra),
    createRewriteMeta("ui.rewrite.startGenerators", startGenerators),
    button
  );

  const lossesTitle = el("h2", { className: "section-title" });
  lossesTitle.append(text(t("ui.rewrite.losses")));
  const losses = el("section", { className: "rewrite-losses" });
  const lostLoc = text(view.preview.lostLoc);
  const lostMoney = text(view.preview.lostMoney);
  const lostAgents = text(view.preview.lostAgents);
  const lostHardware = text(view.preview.lostHardware);
  const lostProducts = text(view.preview.lostProducts);
  const lostUpgrades = text(view.preview.lostUpgrades);
  losses.append(
    createRewriteMeta("ui.resource.loc", lostLoc),
    createRewriteMeta("ui.resource.money", lostMoney),
    createRewriteMeta("ui.devfloor.agent", lostAgents),
    createRewriteMeta("ui.devfloor.hardware", lostHardware),
    createRewriteMeta("ui.projects.portfolio", lostProducts),
    createRewriteMeta("ui.devfloor.upgrades", lostUpgrades)
  );

  const treeTitle = el("h2", { className: "section-title" });
  treeTitle.append(text(t("ui.rewrite.insightTree")));
  const tree = el("section", { className: "insight-tree" });

  for (const branch of ["velocity", "capital", "craft", "core"]) {
    const column = el("section", { className: `insight-branch insight-branch--${branch}` });
    const branchTitle = el("h3", { className: "insight-branch__title" });
    branchTitle.append(text(t(`ui.insight.branch.${branch}`)));
    column.append(branchTitle);

    for (const node of view.nodes.filter((entry) => entry.branch === branch)) {
      column.append(createInsightNode(node, actions));
    }

    tree.append(column);
  }

  const exitSection = createExitSection(view.exit, actions);
  const paradoxSection = createParadoxSection(view.paradox, actions);

  rewriteNodes = {
    afterInsight,
    boot,
    bootOverlay,
    button,
    currentMultiplier,
    gain,
    insight,
    lostAgents,
    lostHardware,
    lostLoc,
    lostMoney,
    lostProducts,
    lostUpgrades,
    requiredInsight,
    speedup,
    startEra,
    startGenerators,
    startMoney,
    targetMultiplier
  };
  updateRewrite(view);

  screen.append(
    title,
    bootOverlay,
    forecast,
    lossesTitle,
    losses,
    treeTitle,
    tree,
    exitSection,
    paradoxSection
  );
  return screen;
}

function createRewriteBootOverlay(): HTMLElement {
  const overlay = el("section", { className: "rewrite-boot-overlay" });
  overlay.hidden = true;
  overlay.setAttribute("aria-live", "polite");

  const cascade = el("div", { className: "rewrite-boot-overlay__cascade" });
  for (let index = 1; index <= 6; index += 1) {
    const line = el("span", { className: "rewrite-boot-overlay__line" });
    line.append(text(t(`ui.rewrite.bootLine${index}`)));
    cascade.append(line);
  }

  const consoleNode = el("div", { className: "rewrite-boot-overlay__console" });
  const title = el("h2", { className: "rewrite-boot-overlay__title" });
  title.append(text(t("ui.rewrite.bootTitle")));
  const command = el("p", { className: "rewrite-boot-overlay__command" });
  command.append(text(t("ui.rewrite.bootCommand")));
  const cursor = el("span", { className: "rewrite-boot-overlay__cursor" });
  cursor.append(text(t("ui.rewrite.bootCursor")));
  command.append(cursor);
  const skip = createSettingsButton("ui.rewrite.skipBoot", () => {
    overlay.dataset.skipped = "1";
    overlay.hidden = true;
  });
  skip.classList.add("rewrite-boot-overlay__skip");
  consoleNode.append(title, command, skip);
  overlay.append(cascade, consoleNode);
  return overlay;
}

function createExitSection(view: ExitView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "exit-section" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.exit.title")));

  const forecast = el("section", { className: "rewrite-forecast exit-forecast" });
  const currentEquity = text(view.preview.currentEquity);
  const gain = text(view.preview.gain);
  const requiredInsight = text(view.preview.requiredInsight);
  const totalInsightEarned = text(view.preview.totalInsightEarned);
  const equityAfter = text(view.preview.equityAfter);
  const currentMultiplier = text(view.preview.currentMultiplier);
  const targetMultiplier = text(view.preview.targetMultiplier);
  const rewardMultiplier = text(view.preview.rewardMultiplier);
  const button = createProjectButton("ui.exit.action", actions.exit);

  forecast.append(
    createRewriteMeta("ui.exit.equity", currentEquity),
    createRewriteMeta("ui.exit.gain", gain),
    createRewriteMeta("ui.exit.required", requiredInsight),
    createRewriteMeta("ui.exit.earnedInsight", totalInsightEarned),
    createRewriteMeta("ui.exit.after", equityAfter),
    createRewriteMeta("ui.exit.currentMult", currentMultiplier),
    createRewriteMeta("ui.exit.nextMult", targetMultiplier),
    createRewriteMeta("ui.exit.rewardMult", rewardMultiplier),
    button
  );

  const perksTitle = el("h3", { className: "section-title" });
  perksTitle.append(text(t("ui.exit.perks")));
  const perks = el("section", { className: "equity-perk-list" });
  for (const perk of view.perks) {
    perks.append(createEquityPerk(perk, actions));
  }

  const modifiersTitle = el("h3", { className: "section-title" });
  modifiersTitle.append(text(t("ui.exit.runModifiers")));
  const modifiers = el("section", { className: "run-modifier-list" });
  for (const modifier of view.runModifiers) {
    modifiers.append(createRunModifier(modifier, actions));
  }

  exitNodes = {
    button,
    currentEquity,
    currentMultiplier,
    equityAfter,
    gain,
    requiredInsight,
    rewardMultiplier,
    targetMultiplier,
    totalInsightEarned
  };

  section.append(title, forecast, perksTitle, perks, modifiersTitle, modifiers);
  return section;
}

function createParadoxSection(view: ParadoxView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "paradox-section" });
  section.hidden = !view.unlocked;
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.paradox.title")));

  const forecast = el("section", { className: "rewrite-forecast paradox-forecast" });
  const currentIteration = text(view.preview.currentIteration);
  const nextIteration = text(view.preview.nextIteration);
  const locRate = text(view.preview.locRate);
  const softcapThreshold = text(view.preview.softcapThreshold);
  const hold = text(view.preview.hold);
  const currentParadox = text(view.preview.currentParadox);
  const paradoxGain = text(view.preview.paradoxGain);
  const paradoxAfter = text(view.preview.paradoxAfter);
  const currentMultiplier = text(view.preview.currentMultiplier);
  const targetMultiplier = text(view.preview.targetMultiplier);
  const button = createProjectButton("ui.paradox.action", actions.iterate);

  forecast.append(
    createRewriteMeta("ui.paradox.iteration", currentIteration),
    createRewriteMeta("ui.paradox.nextIteration", nextIteration),
    createRewriteMeta("ui.paradox.locRate", locRate),
    createRewriteMeta("ui.paradox.threshold", softcapThreshold),
    createRewriteMeta("ui.paradox.hold", hold),
    createRewriteMeta("ui.paradox.paradox", currentParadox),
    createRewriteMeta("ui.paradox.gain", paradoxGain),
    createRewriteMeta("ui.paradox.after", paradoxAfter),
    createRewriteMeta("ui.paradox.currentMult", currentMultiplier),
    createRewriteMeta("ui.paradox.nextMult", targetMultiplier),
    button
  );

  const meta = el("section", { className: "rewrite-losses paradox-meta" });
  const ruleSlots = text(view.ruleSlots);
  const theme = text(view.theme);
  meta.append(
    createRewriteMeta("ui.paradox.ruleSlots", ruleSlots),
    createRewriteMeta("ui.paradox.theme", theme)
  );

  const shopTitle = el("h3", { className: "section-title" });
  shopTitle.append(text(t("ui.paradox.shop")));
  const shop = el("section", { className: "paradox-item-list" });
  for (const item of view.items) {
    shop.append(createParadoxItem(item, actions));
  }

  paradoxNodes = {
    button,
    currentIteration,
    currentMultiplier,
    currentParadox,
    hold,
    locRate,
    nextIteration,
    paradoxAfter,
    paradoxGain,
    root: section,
    ruleSlots,
    softcapThreshold,
    targetMultiplier,
    theme
  };

  section.append(title, forecast, meta, shopTitle, shop);
  return section;
}

function createStatsScreen(view: StatsView): HTMLElement {
  const screen = el("section", { className: "main-screen stats-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.stats")));

  const sparkline = createStatsSparkline(view);
  const sections = el("section", { className: "stats-sections" });
  sections.append(
    createStatsSection("ui.stats.lifetime", view.lifetimeRows),
    createStatsSection("ui.stats.run", view.runRows),
    createStatsSection("ui.stats.records", view.recordsRows)
  );

  screen.append(title, sparkline, sections);
  updateStats(view);
  return screen;
}

function createStatsSparkline(view: StatsView): HTMLElement {
  const panel = el("section", { className: "stats-sparkline" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.stats.sparkline")));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "stats-sparkline__svg");
  svg.setAttribute("viewBox", "0 0 300 80");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", view.sparklineLabel);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "stats-sparkline__path");
  svg.append(path);
  const empty = el("p", { className: "stats-sparkline__empty" });
  empty.append(text(t("ui.stats.sparklineEmpty")));
  panel.append(title, svg, empty);
  statsNodes = { empty, path, svg };
  return panel;
}

function createStatsSection(titleKey: string, rows: readonly StatsRowView[]): HTMLElement {
  const section = el("section", { className: "stats-section" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t(titleKey)));
  const list = el("div", { className: "stats-list" });

  for (const row of rows) {
    list.append(createStatsRow(row));
  }

  section.append(title, list);
  return section;
}

function createStatsRow(row: StatsRowView): HTMLElement {
  const root = el("div", { className: "stats-row" });
  const label = el("span", { className: "stats-row__label" });
  label.append(text(row.label));
  const value = text(row.value);
  const valueNode = el("strong", { className: "stats-row__value" });
  valueNode.append(value);
  root.append(label, valueNode);
  statsRows.set(row.id, { value });
  return root;
}

function createAchievementsScreen(view: AchievementsView): HTMLElement {
  const screen = el("section", { className: "main-screen achievements-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.achievements")));

  const summary = el("section", { className: "achievement-summary" });
  const unlocked = text(view.unlocked);
  const bonus = text(view.bonus);
  summary.append(
    createAchievementSummaryItem("ui.achievements.unlocked", unlocked),
    createAchievementSummaryItem("ui.achievements.bonus", bonus)
  );

  const grid = el("section", { className: "achievement-grid" });
  for (const card of view.cards) {
    grid.append(createAchievementCard(card));
  }

  achievementsNodes = { bonus, grid, unlocked };
  screen.append(title, summary, grid);
  updateAchievements(view, { achievements: screen });
  return screen;
}

function createAchievementSummaryItem(labelKey: string, value: Text): HTMLElement {
  const item = el("div", { className: "achievement-summary__item" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  item.append(label, output);
  return item;
}

function createAchievementCard(view: AchievementCardView): HTMLElement {
  const root = el("article", { className: "achievement-card" });
  const category = text(view.category);
  const categoryNode = el("span", { className: "achievement-card__category" });
  categoryNode.append(category);
  const title = text(view.name);
  const titleNode = el("h2", { className: "achievement-card__title" });
  titleNode.append(title);
  const description = text(view.description);
  const descriptionNode = el("p", { className: "achievement-card__description" });
  descriptionNode.append(description);
  const status = text(view.status);
  const statusNode = el("span", { className: "achievement-card__status" });
  statusNode.append(status);
  root.append(categoryNode, titleNode, descriptionNode, statusNode);
  achievementCards.set(view.id, { category, description, root, status, title });
  updateAchievementCard(view);
  return root;
}

function createSettingsScreen(view: SettingsView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen settings-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.settings")));

  const langValue = el("span", { className: "settings-control__value" });
  langValue.append(text(t("ui.boot.languageValue", { lang: view.lang.toUpperCase() })));

  const notation = el("select", { className: "settings-control__field" });
  notation.append(
    createOption("sci", "ui.settings.notationSci"),
    createOption("suffix", "ui.settings.notationSuffix")
  );
  notation.value = view.notation;
  notation.addEventListener("change", () => {
    actions.changeNotation(notation.value === "suffix" ? "suffix" : "sci");
  });

  const autosaveS = el("input", { className: "settings-control__field" });
  autosaveS.type = "number";
  autosaveS.value = view.autosaveS;
  autosaveS.defaultValue = view.autosaveS;
  autosaveS.addEventListener("change", () => {
    const seconds = Number(autosaveS.value);

    if (Number.isFinite(seconds) && seconds > 0) {
      actions.changeAutosaveS(seconds);
    } else {
      autosaveS.value = autosaveS.defaultValue;
    }
  });

  const sound = el("input", { className: "settings-control__checkbox" });
  sound.type = "checkbox";
  sound.checked = view.sound;
  sound.addEventListener("change", () => {
    actions.changeSound(sound.checked);
  });

  const doNotDisturb = el("input", { className: "settings-control__checkbox" });
  doNotDisturb.type = "checkbox";
  doNotDisturb.checked = view.doNotDisturb;
  doNotDisturb.addEventListener("change", () => {
    actions.changeDoNotDisturb(doNotDisturb.checked);
  });

  const volume = el("input", { className: "settings-control__field" });
  volume.type = "range";
  volume.min = "0";
  volume.max = "1";
  volume.step = "0.01";
  volume.value = view.volume;
  volume.defaultValue = view.volume;
  volume.addEventListener("input", () => {
    const value = Number(volume.value);

    if (Number.isFinite(value)) {
      actions.changeVolume(value);
    }
  });

  const reducedFx = el("input", { className: "settings-control__checkbox" });
  reducedFx.type = "checkbox";
  reducedFx.checked = view.reducedFx;
  reducedFx.addEventListener("change", () => {
    actions.changeReducedFx(reducedFx.checked);
  });

  const glitch = el("input", { className: "settings-control__checkbox" });
  glitch.type = "checkbox";
  glitch.checked = view.glitch;
  glitch.addEventListener("change", () => {
    actions.changeGlitch(glitch.checked);
  });

  const skipIntro = el("input", { className: "settings-control__checkbox" });
  skipIntro.type = "checkbox";
  skipIntro.checked = view.skipIntro;
  skipIntro.addEventListener("change", () => {
    actions.changeSkipIntro(skipIntro.checked);
  });

  const vibexLocalAi = el("input", { className: "settings-control__checkbox" });
  vibexLocalAi.type = "checkbox";
  vibexLocalAi.checked = view.vibexLocalAi;
  vibexLocalAi.addEventListener("change", () => {
    actions.changeVibexLocalAi(vibexLocalAi.checked);
  });

  const localAiStatus = text(view.localAiStatus);
  const localAiStatusValue = el("span", { className: "settings-control__value" });
  localAiStatusValue.append(localAiStatus);

  const localAiProgress = text(
    t("ui.settings.vibexModelMeta", {
      progress: view.localAiProgress,
      size: view.localAiModelSize
    })
  );
  const localAiProgressValue = el("span", { className: "settings-control__value" });
  localAiProgressValue.append(localAiProgress);

  const downloadVibexModel = createSettingsButton("ui.settings.vibexDownloadModel", () => {
    actions.downloadVibexModel();
  });
  downloadVibexModel.disabled = !view.localAiCanDownload;

  const licenseNote = el("p", { className: "settings-note" });
  licenseNote.append(text(t("ui.settings.vibexLicense")));

  const wipeCheck = el("input", { className: "settings-control__checkbox" });
  wipeCheck.type = "checkbox";
  const wipeButton = createSettingsButton("ui.settings.wipe", () => {
    if (wipeCheck.checked) {
      actions.wipeSave();
      wipeCheck.checked = false;
    }
  });
  const resetWindowsButton = createSettingsButton("ui.settings.resetWindows", () => {
    actions.resetWindowLayout();
  });
  const replayTutorialButton = createSettingsButton("ui.settings.replayTutorial", () => {
    actions.replayTutorial();
  });
  const quitButton = createSettingsButton("ui.settings.quitToTitle", () => {
    actions.quitToTitle();
  });

  const controls = el("section", { className: "settings-list" });
  controls.append(
    createSettingsControl("ui.settings.language", langValue),
    createSettingsControl("ui.settings.notation", notation),
    createSettingsControl("ui.settings.autosave", autosaveS),
    createSettingsControl("ui.settings.sound", sound),
    createSettingsControl("ui.settings.doNotDisturb", doNotDisturb),
    createSettingsControl("ui.settings.volume", volume),
    createSettingsControl("ui.settings.reducedFx", reducedFx),
    createSettingsControl("ui.settings.glitch", glitch),
    createSettingsControl("ui.settings.skipIntro", skipIntro),
    createSettingsControl("ui.settings.vibexLocalAi", vibexLocalAi),
    createSettingsControl("ui.settings.vibexAiStatus", localAiStatusValue),
    createSettingsControl("ui.settings.vibexModel", localAiProgressValue),
    createSettingsControl("ui.settings.vibexDownload", downloadVibexModel),
    createSettingsControl("ui.settings.wipeConfirm", wipeCheck)
  );

  const actionsPanel = el("section", { className: "settings-actions" });
  const actionsTitle = el("h2", { className: "section-title" });
  actionsTitle.append(text(t("ui.settings.gameControls")));
  const actionsRow = el("div", { className: "settings-actions__buttons" });
  actionsRow.append(resetWindowsButton, replayTutorialButton, quitButton, wipeButton);
  actionsPanel.append(actionsTitle, actionsRow);

  settingsNodes = {
    autosaveS,
    downloadVibexModel,
    doNotDisturb,
    glitch,
    localAiProgress,
    localAiStatus,
    notation,
    reducedFx,
    skipIntro,
    sound,
    vibexLocalAi,
    volume
  };
  screen.append(title, controls, licenseNote, actionsPanel);
  return screen;
}

function createOfflineModal(view: OfflineView, actions: AppActions): HTMLElement {
  const root = el("section", { className: "offline-modal" });
  root.hidden = !view.visible;

  const panel = el("div", { className: "offline-modal__panel" });
  const title = el("h2", { className: "offline-modal__title" });
  title.append(text(t("ui.offline.title")));

  const duration = text(view.duration);
  const loc = text(view.loc);
  const money = text(view.money);
  const hype = text(view.hype);
  const close = createSettingsButton("ui.offline.close", actions.dismissOffline);

  panel.append(
    title,
    createProjectMeta("ui.offline.duration", duration),
    createProjectMeta("ui.offline.loc", loc),
    createProjectMeta("ui.offline.money", money),
    createProjectMeta("ui.offline.hype", hype),
    close
  );
  root.append(panel);
  offlineNodes = { duration, hype, loc, money, root };
  return root;
}

function createVibexWorkspace(view: VibexView, terminal: TerminalViewNodes): VibexNodes {
  const root = el("section", { className: "vibex-workspace" });
  const filePanel = el("aside", { className: "vibex-files" });
  const fileTitle = el("h2", { className: "vibex-pane-title" });
  fileTitle.append(text(t("vibex.files.title")));
  const fileList = el("div", { className: "vibex-files__list" });
  const fileRows = new Map<string, HTMLElement>();
  const fileTexts = new Map<string, Text>();

  for (const file of view.files) {
    const row = el("div", { className: "vibex-file" });
    const label = text(file.label);
    row.dataset.fileId = file.id;
    row.append(label);
    row.classList.toggle("vibex-file--active", file.active);
    fileRows.set(file.id, row);
    fileTexts.set(file.id, label);
    fileList.append(row);
  }

  filePanel.append(fileTitle, fileList);

  const codePane = el("section", { className: "vibex-code" });
  const codeTitle = el("h2", { className: "vibex-pane-title" });
  codeTitle.append(text(t("vibex.code.title")));
  const stream = el("div", { className: "vibex-code__stream" });
  const codeRows: HTMLElement[] = [];
  const codeTexts: Text[] = [];

  view.codeLines.forEach((line, index) => {
    appendVibexCodeLine(stream, codeRows, codeTexts, line, index);
  });

  codePane.append(codeTitle, stream);
  const codeStack = el("section", { className: "vibex-code-stack" });
  const terminalPanel = el("section", { className: "vibex-terminal-panel" });
  const terminalTitle = el("h2", { className: "vibex-pane-title" });
  terminalTitle.append(text(t("ui.terminal.title")));
  terminalPanel.append(terminalTitle, terminal.logRoot);
  codeStack.append(codePane, terminalPanel);
  root.append(filePanel, codeStack, terminal.root);

  return {
    cannedPrompt: terminal.cannedPrompt,
    cannedResponse: terminal.cannedResponse,
    codeRows,
    codeStream: stream,
    codeTexts,
    fileRows,
    fileTexts,
    lastCodeSequence: view.codeSequence,
    root,
    terminal
  };
}

function updateVibex(nodes: VibexNodes, view: VibexView): void {
  setText(nodes.cannedPrompt, view.cannedPrompt);
  setText(nodes.cannedResponse, view.cannedResponse);

  for (const file of view.files) {
    nodes.fileRows.get(file.id)?.classList.toggle("vibex-file--active", file.active);
    const label = nodes.fileTexts.get(file.id);
    if (label !== undefined) {
      setText(label, file.label);
    }
  }

  if (nodes.lastCodeSequence === view.codeSequence) {
    return;
  }

  nodes.lastCodeSequence = view.codeSequence;

  view.codeLines.forEach((line, index) => {
    if (nodes.codeRows[index] === undefined) {
      appendVibexCodeLine(nodes.codeStream, nodes.codeRows, nodes.codeTexts, line, index);
      return;
    }

    const row = nodes.codeRows[index]!;
    row.hidden = false;
    row.dataset.lineId = line.id;
    setText(nodes.codeTexts[index]!, line.text);
    animateVibexCodeLine(row, index);
  });

  nodes.codeRows.slice(view.codeLines.length).forEach((row) => {
    row.hidden = true;
  });
}

function appendVibexCodeLine(
  stream: HTMLElement,
  rows: HTMLElement[],
  texts: Text[],
  line: VibexCodeLineView,
  index: number
): void {
  const row = el("div", { className: "vibex-code-line vibex-code-line--active" });
  const lineText = text(line.text);

  row.dataset.lineId = line.id;
  row.append(lineText);
  animateVibexCodeLine(row, index);
  rows.push(row);
  texts.push(lineText);
  stream.append(row);
}

function animateVibexCodeLine(row: HTMLElement, index: number): void {
  row.style.setProperty("--vibex-line-index", String(index));
  row.classList.remove("vibex-code-line--active");
  void row.offsetWidth;
  row.classList.add("vibex-code-line--active");
}

function createTerminal(view: VibexView, actions: AppActions): TerminalViewNodes {
  const terminal = el("section", { className: "terminal vibex-terminal" });
  const header = el("div", { className: "terminal__header" });
  header.append(text(t("vibex.aiAssistant.title")));
  const log = createTerminalLog();

  const canned = el("section", { className: "vibex-canned" });
  const cannedPromptLabel = el("span", { className: "vibex-canned__label" });
  cannedPromptLabel.append(text(t("vibex.canned.promptLabel")));
  const cannedPrompt = el("p", { className: "vibex-canned__prompt" });
  const cannedPromptText = text(view.cannedPrompt);
  cannedPrompt.append(cannedPromptText);
  const cannedResponseLabel = el("span", { className: "vibex-canned__label" });
  cannedResponseLabel.append(text(t("vibex.canned.responseLabel")));
  const cannedResponse = el("p", { className: "vibex-canned__response" });
  const cannedResponseText = text(view.cannedResponse);
  cannedResponse.append(cannedResponseText);
  canned.append(cannedPromptLabel, cannedPrompt, cannedResponseLabel, cannedResponse);

  const input = el("textarea", { className: "vibex-terminal__input" });
  input.placeholder = t("vibex.input.placeholder");

  const prompt = el("button", { className: "terminal__prompt" });
  prompt.type = "button";
  prompt.append(text(t("vibex.send")));

  const flowRow = el("div", { className: "terminal__counter" });
  const label = el("span", { className: "terminal__counter-label" });
  label.append(text(t("ui.terminal.flow")));
  const flowValue = el("strong", { className: "terminal__counter-value" });
  const flowText = text("");
  flowValue.append(flowText);
  flowRow.append(label, flowValue);

  const frameTrack = el("div", { className: "terminal__frame-track" });
  const flowBar = el("div", { className: "terminal__frame-bar" });
  frameTrack.append(flowBar);
  const particles = createPromptParticles();

  prompt.addEventListener("click", () => {
    runVibexSend(actions, {
      addLog: log.addLog,
      assistantPrompt: cannedPromptText,
      assistantResponse: cannedResponseText,
      input,
      showParticle: particles.show
    });
  });

  terminal.append(header, canned, input, flowRow, frameTrack, prompt, particles.root);
  const nodes = {
    addLog: log.addLog,
    cannedPrompt: cannedPromptText,
    cannedResponse: cannedResponseText,
    flowBar,
    flowText,
    input,
    logRoot: log.root,
    prompt,
    root: terminal,
    showParticle: particles.show
  };
  return nodes;
}

function runVibexSend(
  actions: AppActions,
  nodes: {
    readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
    readonly assistantPrompt: Text;
    readonly assistantResponse: Text;
    readonly input: HTMLTextAreaElement;
    readonly showParticle: (value: string) => void;
  }
): void {
  const result = actions.sendVibexPrompt(nodes.input.value, "manual");
  nodes.input.value = "";
  setText(nodes.assistantPrompt, result.prompt);
  setText(nodes.assistantResponse, result.response);

  if (result.pendingResponse !== undefined) {
    void result.pendingResponse.then((response) => {
      setText(nodes.assistantResponse, response);
    });
  }

  nodes.addLog(t("ui.terminal.promptLog", { loc: result.loc }));
  if (result.committed) {
    nodes.addLog(t("vibex.log.committed"), { priority: true });
  }
  nodes.showParticle(result.loc);
}

function runVibexAutoPrompt(
  actions: AppActions,
  nodes: {
    readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
    readonly showParticle: (value: string) => void;
  }
): void {
  const result = actions.sendVibexPrompt("", "auto");

  nodes.addLog(t("ui.terminal.promptLog", { loc: result.loc }));

  if (result.committed) {
    nodes.addLog(t("vibex.log.committed"), { priority: true });
  }

  nodes.showParticle(result.loc);
}

function handleShortcut(
  event: KeyboardEvent,
  desktop: DesktopNodes,
  terminal: TerminalViewNodes,
  actions: AppActions
): void {
  if (event.defaultPrevented || desktop.currentScene !== "desktop") {
    return;
  }

  if (event.ctrlKey && event.key === "Tab") {
    event.preventDefault();
    cycleWindowFocus(desktop, actions);
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey || isEditableShortcutTarget(event.target)) {
    return;
  }

  if (event.key === "Escape" && offlineNodes !== undefined && !offlineNodes.root.hidden) {
    event.preventDefault();
    actions.dismissOffline();
    return;
  }

  if (event.key === "Escape") {
    const appId = getActiveWindowApp(desktop);

    if (appId !== undefined) {
      event.preventDefault();
      actions.minimizeApp(appId);
    }

    return;
  }

  if (event.key === " " && !isButtonShortcutTarget(event.target)) {
    event.preventDefault();
    runVibexAutoPrompt(actions, {
      addLog: terminal.addLog,
      showParticle: terminal.showParticle
    });
    return;
  }

  if (event.key >= "1" && event.key <= "7") {
    const appId = getShortcutApp(event.key);

    if (appId !== undefined) {
      event.preventDefault();
      actions.openApp(appId, getDesktopBounds(desktop.windowsLayer));
    }

    return;
  }

  if (event.key.toLowerCase() === "b") {
    const generatorId = getFocusedGeneratorId(event.target);

    if (generatorId !== undefined && isAppVisible(desktop.currentWindows, "agents")) {
      event.preventDefault();
      actions.buyGenerator(generatorId, "max");
    }
  }
}

function getShortcutApp(key: string): AppId | undefined {
  return screenLinks.find((link) => link.shortcut === key)?.appId;
}

function cycleWindowFocus(desktop: DesktopNodes, actions: AppActions): void {
  const visibleApps = APP_IDS.filter((appId) => isAppVisible(desktop.currentWindows, appId)).sort(
    (left, right) => desktop.currentWindows[left].z - desktop.currentWindows[right].z
  );

  if (visibleApps.length === 0) {
    return;
  }

  const active = getActiveWindowApp(desktop);
  const activeIndex = active === undefined ? -1 : visibleApps.indexOf(active);
  const nextApp = visibleApps[(activeIndex + 1) % visibleApps.length];

  if (nextApp !== undefined) {
    actions.focusApp(nextApp);
  }
}

function getActiveWindowApp(desktop: DesktopNodes): AppId | undefined {
  let activeApp: AppId | undefined;
  let activeZ = -1;

  for (const appId of APP_IDS) {
    const windowState = desktop.currentWindows[appId];

    if (isWindowVisible(windowState) && windowState.z > activeZ) {
      activeApp = appId;
      activeZ = windowState.z;
    }
  }

  return activeApp;
}

function getFocusedGeneratorId(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }

  return target.closest<HTMLElement>(".agent-row")?.dataset.generatorId;
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, select, textarea"))
  );
}

function isButtonShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button") !== null;
}

function isInteractiveWindowTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("button, input, select, textarea, [role='button']") !== null
  );
}

function getInteractiveWindowTargetAtPoint(
  container: HTMLElement,
  x: number,
  y: number
): HTMLElement | undefined {
  const controls = Array.from(
    container.querySelectorAll<HTMLElement>("button, input, select, textarea, [role='button']")
  );

  for (let index = controls.length - 1; index >= 0; index -= 1) {
    const control = controls[index];
    if (control === undefined) {
      continue;
    }

    if (control.closest("[hidden]") !== null || control.matches(":disabled")) {
      continue;
    }

    const style = window.getComputedStyle(control);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.pointerEvents === "none"
    ) {
      continue;
    }

    const rect = control.getBoundingClientRect();
    if (
      rect.width > 0 &&
      rect.height > 0 &&
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return control;
    }
  }

  return undefined;
}

function activateWindowControl(control: HTMLElement): void {
  if (control instanceof HTMLButtonElement) {
    control.click();
    return;
  }

  if (control instanceof HTMLInputElement) {
    if (control.type === "checkbox" || control.type === "radio") {
      control.click();
      return;
    }

    control.focus();
    return;
  }

  if (control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
    control.focus();
    return;
  }

  control.click();
}

function createTerminalLog(): {
  readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
  readonly root: HTMLElement;
} {
  const root = el("section", { className: "terminal-log" });
  const rows: TerminalLogRow[] = [];
  let nextIndex = 0;
  let windowStartedAtMs = 0;
  let windowCount = 0;
  let throttledCount = 0;
  let lastRow: TerminalLogRow | undefined;

  for (let i = 0; i < TERMINAL_LOG_CAPACITY; i += 1) {
    const row = el("div", { className: "terminal-log__row" });
    const rowText = text("");
    row.hidden = true;
    row.append(rowText);
    root.append(row);
    rows.push({ root: row, text: rowText });
  }

  return {
    root,

    addLog(message: string, options?: TerminalLogOptions): Text {
      const nowMs = performance.now();
      if (nowMs - windowStartedAtMs >= 1000) {
        windowStartedAtMs = nowMs;
        windowCount = 0;
        throttledCount = 0;
      }

      if (options?.priority === true && windowCount >= TERMINAL_LOG_RATE_LIMIT) {
        windowStartedAtMs = nowMs;
        windowCount = 0;
        throttledCount = 0;
      }

      if (windowCount >= TERMINAL_LOG_RATE_LIMIT) {
        throttledCount += 1;
        if (lastRow !== undefined) {
          setText(lastRow.text, t("ui.terminal.logOverflow", { count: throttledCount }));
          return lastRow.text;
        }
        return rows[0]!.text;
      }

      const row = rows[nextIndex];
      if (row === undefined) {
        return rows[0]!.text;
      }

      setText(row.text, message);
      row.root.hidden = false;
      root.append(row.root);
      lastRow = row;
      nextIndex = (nextIndex + 1) % TERMINAL_LOG_CAPACITY;
      windowCount += 1;
      return row.text;
    }
  };
}

function createPromptParticles(): {
  readonly root: HTMLElement;
  readonly show: (value: string) => void;
} {
  const root = el("div", { className: "terminal-particles" });
  const particles: TerminalParticle[] = [];
  let nextIndex = 0;

  for (let i = 0; i < CLICK_PARTICLE_POOL_SIZE; i += 1) {
    const particle = el("span", { className: "terminal-particle" });
    const particleText = text("");
    particle.hidden = true;
    particle.append(particleText);
    particle.addEventListener("animationend", () => {
      particle.hidden = true;
      particle.classList.remove("terminal-particle--active");
    });
    root.append(particle);
    particles.push({ root: particle, text: particleText });
  }

  return {
    root,

    show(value: string): void {
      const particle = particles[nextIndex];
      if (particle === undefined) {
        return;
      }

      setText(particle.text, t("ui.terminal.promptParticle", { loc: value }));
      particle.root.hidden = false;
      particle.root.classList.remove("terminal-particle--active");
      particle.root.style.left = `${20 + nextIndex * 6}%`;
      void particle.root.offsetWidth;
      particle.root.classList.add("terminal-particle--active");
      nextIndex = (nextIndex + 1) % CLICK_PARTICLE_POOL_SIZE;
    }
  };
}

function createToasts(): ToastPool {
  const root = el("section", {
    ariaLabel: t("ui.toast.ariaLabel"),
    className: "toast-stack"
  });
  root.setAttribute("aria-live", "polite");
  const toasts: ToastNode[] = [];
  let nextIndex = 0;

  for (let i = 0; i < TOAST_POOL_SIZE; i += 1) {
    const toast = el("button", { className: "toast" });
    const icon = el("span", { className: "toast__icon" });
    const textWrap = el("span", { className: "toast__text" });
    const toastText = text("");
    const node: ToastNode = { icon, onClick: undefined, root: toast, text: toastText };
    toast.type = "button";
    toast.tabIndex = -1;
    toast.hidden = true;
    icon.hidden = true;
    textWrap.append(toastText);
    toast.append(icon, textWrap);
    toast.addEventListener("animationend", () => {
      toast.hidden = true;
      toast.classList.remove("toast--active");
    });
    toast.addEventListener("click", () => {
      node.onClick?.();
      toast.hidden = true;
      toast.classList.remove("toast--active", "toast--action");
    });
    root.append(toast);
    toasts.push(node);
  }

  return {
    root,

    show(message: string, tone: ToastTone, options?: ToastOptions): void {
      const toast = toasts[nextIndex];

      if (toast === undefined) {
        return;
      }

      toast.onClick = options?.onClick;
      toast.root.tabIndex = toast.onClick === undefined ? -1 : 0;
      toast.root.classList.toggle("toast--action", toast.onClick !== undefined);
      toast.root.setAttribute("aria-label", message);
      toast.icon.replaceChildren();
      if (options?.iconPath === undefined) {
        toast.icon.hidden = true;
      } else {
        toast.icon.hidden = false;
        toast.icon.append(createIcon(options.iconPath));
      }
      setText(toast.text, message);
      toast.root.dataset.tone = tone;
      toast.root.hidden = false;
      toast.root.classList.remove("toast--active");
      void toast.root.offsetWidth;
      toast.root.classList.add("toast--active");
      nextIndex = (nextIndex + 1) % TOAST_POOL_SIZE;
    }
  };
}

function createCommsPanels(view: CommsView, actions: AppActions): Record<CommsChannel, CommsNodes> {
  return {
    chat: createCommsPanel("chat", view, actions),
    mail: createCommsPanel("mail", view, actions),
    feed: createCommsPanel("feed", view, actions)
  };
}

function createCommsPanel(channel: CommsChannel, view: CommsView, actions: AppActions): CommsNodes {
  const panel = el("aside", { className: "comms" });
  const header = el("div", { className: "comms__header" });
  const title = el("h2", { className: "comms__title" });
  title.append(text(t(`ui.app.${channel}`)));

  const badge = el("span", { className: "comms__badge" });
  header.append(title, badge);

  const list = el("section", { className: "comms__list" });
  const empty = el("p", { className: "comms__empty" });
  empty.append(text(t("ui.comms.empty")));

  panel.append(header, list, empty);

  const nodes = {
    root: panel,
    badge,
    channel,
    currentView: undefined,
    empty,
    lastEntryId: "",
    list,
    messages: new Map<string, CommsMessageNodes>(),
    messageCount: 0
  };
  updateComms(nodes, view, actions);
  return nodes;
}

function createEndingModal(view: EndingModalView, actions: AppActions): EndingModalNodes {
  const root = el("section", { className: "ending-modal" });
  const nodes = { root, signature: "" };
  updateEndingModal(nodes, view, actions);
  return nodes;
}

function updateComms(nodes: CommsNodes, view: CommsView, actions: AppActions): void {
  if (shouldSkipCommsUpdate(nodes.currentView, nodes.channel, view, nodes.channel)) {
    return;
  }

  nodes.currentView = view;
  nodes.root.classList.toggle("comms--quiet", view.quiet);
  const unreadCount = view.unreadByChannel[nodes.channel];
  nodes.badge.hidden = unreadCount === 0;
  setTextContent(nodes.badge, t("ui.comms.unread", { count: unreadCount }));
  const messages = getCommsMessagesForChannel(view, nodes.channel);

  if (isCommsStructureChanged(messages, nodes.messageCount, nodes.lastEntryId)) {
    syncCommsMessageNodes(nodes, messages, actions);
  }

  for (const message of messages) {
    const messageNodes = nodes.messages.get(message.entryId);

    if (messageNodes === undefined) {
      continue;
    }

    updateCommsMessage(messageNodes, message, actions, view.quiet);
  }

  nodes.empty.hidden = messages.length > 0;
}

function syncCommsMessageNodes(
  nodes: CommsNodes,
  messages: readonly CommsMessageView[],
  actions: AppActions
): void {
  const previousLastEntryId = messages[nodes.messageCount - 1]?.entryId ?? "";
  const canAppend = nodes.messageCount === 0 || previousLastEntryId === nodes.lastEntryId;

  if (messages.length < nodes.messageCount || !canAppend) {
    nodes.messages.clear();
    nodes.list.replaceChildren();
    nodes.messageCount = 0;
  }

  for (let index = nodes.messageCount; index < messages.length; index += 1) {
    const message = messages[index];

    if (message !== undefined) {
      nodes.list.append(createCommsMessage(message, actions, nodes.messages));
    }
  }

  nodes.messageCount = messages.length;
  nodes.lastEntryId = getLastEntryId(messages);
}

function createCommsMessage(
  message: CommsMessageView,
  actions: AppActions,
  messages: Map<string, CommsMessageNodes>
): HTMLElement {
  const root = el("article", {
    ariaLabel: t("ui.comms.messageAria", {
      channel: t(`ui.comms.${message.channel}`),
      speaker: message.speaker
    }),
    className: "comms-message"
  });
  const header = el("div", { className: "comms-message__header" });
  const speaker = el("strong", { className: "comms-message__speaker" });
  speaker.append(text(message.speaker));
  const channel = el("span", { className: "comms-message__channel" });
  channel.append(text(t(`ui.comms.${message.channel}`)));
  header.append(speaker, channel);

  const body = el("div", { className: "comms-message__body" });
  const lines = message.lines.map((line) => {
    const lineNode = el("p", { className: "comms-message__line" });
    const lineText = text(line);
    lineNode.append(lineText);
    body.append(lineNode);
    return lineText;
  });

  const choices = el("div", { className: "comms-message__choices" });
  const selected = text("");
  const selectedNode = el("p", { className: "comms-message__selected" });
  selectedNode.append(selected);

  root.append(header, body, choices, selectedNode);
  const nodes = { root, choices, lines, selected };
  messages.set(message.entryId, nodes);
  updateCommsMessage(nodes, message, actions, false);
  return root;
}

function updateCommsMessage(
  nodes: CommsMessageNodes,
  message: CommsMessageView,
  actions: AppActions,
  quiet: boolean
): void {
  nodes.root.classList.toggle("comms-message--unread", message.unread);
  nodes.root.classList.toggle("comms-message--typing", message.unread && !quiet);
  nodes.choices.hidden = message.choices.length === 0 || !message.pendingChoice;

  const choiceSignature = getCommsChoiceSignature(message);
  if (nodes.choices.dataset.signature !== choiceSignature) {
    nodes.choices.dataset.signature = choiceSignature;
    nodes.choices.replaceChildren(
      ...message.choices.map((choice) => createCommsChoiceButton(message, choice, actions))
    );
  }

  const selected = message.choices.find((choice) => choice.selected);
  setText(
    nodes.selected,
    selected === undefined ? "" : t("ui.comms.choiceSelected", { choice: selected.label })
  );
}

function createCommsChoiceButton(
  message: CommsMessageView,
  choice: CommsChoiceView,
  actions: AppActions
): HTMLButtonElement {
  const button = el("button", { className: "comms-message__choice", title: choice.label });
  button.type = "button";
  button.disabled = !message.pendingChoice;
  button.append(text(choice.label));
  button.addEventListener("click", () => {
    actions.chooseStoryChoice(message.eventId, choice.id);
  });
  return button;
}

function getCommsChoiceSignature(message: CommsMessageView): string {
  if (message.choices.length === 0) {
    return message.pendingChoice ? "1:" : "0:";
  }

  let signature = message.pendingChoice ? "1:" : "0:";

  for (const choice of message.choices) {
    signature += `${choice.id},`;
  }

  return signature;
}

export function shouldSkipCommsUpdate(
  currentView: CommsView | undefined,
  currentChannel: CommsChannel,
  nextView: CommsView,
  nextChannel: CommsChannel
): boolean {
  return currentView === nextView && currentChannel === nextChannel;
}

export function isCommsStructureChanged(
  messages: readonly Pick<CommsMessageView, "entryId">[],
  messageCount: number,
  lastEntryId: string
): boolean {
  return messages.length !== messageCount || getLastEntryId(messages) !== lastEntryId;
}

function getLastEntryId(messages: readonly Pick<CommsMessageView, "entryId">[]): string {
  return messages[messages.length - 1]?.entryId ?? "";
}

function getCommsMessagesForChannel(
  view: CommsView,
  channel: CommsChannel
): readonly CommsMessageView[] {
  return view.messages.filter((message) => message.channel === channel);
}

function setTextContent(node: HTMLElement, value: string): void {
  if (node.textContent !== value) {
    node.textContent = value;
  }
}

function createResourceCounter(labelKey: string, counter: ResourceCounterNodes): HTMLElement {
  const label = el("span", { className: "resource-counter__label" });
  label.append(text(t(labelKey)));

  const currentValue = el("strong", { className: "resource-counter__value" });
  currentValue.append(counter.value);

  counter.root.append(label, currentValue);
  return counter.root;
}

function createGeneratorRow(view: GeneratorRowView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "agent-row" });
  root.dataset.generatorId = view.id;
  const name = el("strong", { className: "agent-row__name" });
  const nameText = text(view.name);
  name.append(nameText);

  const owned = text(view.owned);
  const rate = text(view.rate);
  const cost1 = text(view.cost1);
  const cost10 = text(view.cost10);
  const milestone = text(view.milestoneLabel);
  const milestoneTrack = el("div", { className: "agent-row__milestone-track" });
  const milestoneBar = el("div", { className: "agent-row__milestone-bar" });
  milestoneTrack.append(milestoneBar);

  const buy1 = createBuyButton("ui.devfloor.buy1", () => actions.buyGenerator(view.id, 1));
  const buy10 = createBuyButton("ui.devfloor.buy10", () => actions.buyGenerator(view.id, 10));
  const buyMax = createBuyButton("ui.devfloor.buyMax", () => actions.buyGenerator(view.id, "max"));

  root.append(
    name,
    createValueCell(owned),
    createValueCell(rate),
    createCostCell(cost1, cost10),
    createMilestoneCell(milestone, milestoneTrack),
    createButtonCell(buy1, buy10, buyMax)
  );

  generatorRows.set(view.id, {
    buy1,
    buy10,
    buyMax,
    cost1,
    cost10,
    milestone,
    milestoneBar,
    name: nameText,
    owned,
    rate,
    root
  });
  updateGeneratorRow(view);

  return root;
}

function createHardwareRow(view: HardwareRowView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "hardware-row" });
  const name = el("strong", { className: "hardware-row__name" });
  name.append(text(view.name));
  const slot = text(view.slotLabel);
  const level = text(view.levelLabel);
  const cost = text(view.cost);
  const capText = text(view.capAdd);
  const powerText = text(view.powerCost);
  const requirementText = text(view.psuRequirement);
  const detail = el("span", { className: "hardware-row__detail" });
  const cap = el("span", { className: "hardware-row__cap" });
  const power = el("span", { className: "hardware-row__power" });
  const requirement = el("span", { className: "hardware-row__requirement" });
  cap.append(capText);
  power.append(powerText);
  requirement.append(requirementText);
  detail.append(cap, power, requirement);
  const buy = createBuyButton("ui.devfloor.buy1", () => actions.buyHardware(view.id));

  root.append(
    name,
    createValueCell(slot),
    createValueCell(level),
    createValueCell(cost),
    detail,
    buy
  );
  hardwareRows.set(view.id, {
    buy,
    cap: capText,
    cost,
    level,
    power: powerText,
    requirement: requirementText,
    root,
    slot
  });
  updateHardwareRow(view);
  return root;
}

function createUpgradeRow(view: UpgradeRowView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "upgrade-row" });
  const name = el("strong", { className: "upgrade-row__name" });
  name.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createBuyButton("ui.devfloor.buy", () => actions.buyUpgrade(view.id));

  root.append(name, createValueCell(effect), createValueCell(cost), createValueCell(state), button);
  upgradeRows.set(view.id, { button, cost, effect, root, state });
  updateUpgradeRow(view);
  return root;
}

function createAutomationToggle(view: AutomationToggleView, actions: AppActions): HTMLElement {
  const root = el("label", { className: "automation-toggle" });
  const checkbox = el("input", { className: "automation-toggle__checkbox" });
  checkbox.type = "checkbox";
  checkbox.addEventListener("change", () => {
    actions.toggleAutomation(view.id, checkbox.checked);
  });

  const copy = el("span", { className: "automation-toggle__copy" });
  const label = el("strong", { className: "automation-toggle__label" });
  label.append(text(view.label));
  const detail = text(view.detail);
  const detailNode = el("span", { className: "automation-toggle__detail" });
  detailNode.append(detail);
  copy.append(label, detailNode);
  root.append(checkbox, copy);
  automationToggles.set(view.id, { checkbox, detail, root });
  updateAutomationToggle(view);
  return root;
}

function createProjectOffer(view: ProjectOfferView, actions: AppActions): HTMLElement {
  const root = el("article", { className: "project-card" });
  const name = el("h2", { className: "project-card__title" });
  name.append(text(view.name));
  const tag = text(view.tag);
  const cost = text(view.cost);
  const payout = text(view.payout);
  const revenue = text(view.revenue);
  const buildTime = text(view.buildTime);
  const button = createProjectButton("ui.projects.build", () => actions.startProject(view.id));

  root.append(
    name,
    createProjectMeta("ui.projects.tag", tag),
    createProjectMeta("ui.projects.cost", cost),
    createProjectMeta("ui.projects.payout", payout),
    createProjectMeta("ui.projects.revenue", revenue),
    createProjectMeta("ui.projects.time", buildTime),
    button
  );

  projectOffers.set(view.id, {
    buildTime,
    button,
    cost,
    payout,
    revenue,
    root,
    tag
  });
  updateProjectOffer(view);
  return root;
}

function createActiveBuild(view: ActiveBuildView): HTMLElement {
  const root = el("div", { className: "active-build" });
  const name = el("strong", { className: "active-build__name" });
  name.append(text(view.name));
  const remaining = text(view.remaining);
  const track = el("div", { className: "active-build__track" });
  const progress = el("div", { className: "active-build__bar" });
  track.append(progress);
  root.append(name, createValueCell(remaining), track);
  activeBuilds.set(view.id, { progress, remaining, root });
  updateActiveBuild(view);
  return root;
}

function createProduct(view: ProductView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "product-row" });
  const name = el("strong", { className: "product-row__name" });
  name.append(text(view.name));
  const revenue = text(view.revenue);
  const status = text(view.status);
  const fix = createProjectButton("ui.projects.fixBug", () => actions.fixBug(view.id));
  root.append(name, createValueCell(revenue), createValueCell(status), fix);
  products.set(view.id, { fix, revenue, root, status });
  updateProduct(view);
  return root;
}

function createRefactorPanel(view: RefactorView, actions: AppActions): HTMLElement {
  const root = el("section", { className: "refactor-panel" });
  const title = el("h2", { className: "refactor-panel__title" });
  title.append(text(t("ui.projects.refactor")));
  const debt = text(view.debt);
  const cost = text(view.cost);
  const effect = text(view.effect);
  const buildTime = text(view.buildTime);
  const button = createProjectButton("ui.projects.refactorAction", actions.startRefactor);

  root.append(
    title,
    createProjectMeta("ui.projects.debt", debt),
    createProjectMeta("ui.projects.cost", cost),
    createProjectMeta("ui.projects.effect", effect),
    createProjectMeta("ui.projects.time", buildTime),
    button
  );

  refactorNodes = { button, cost, debt, effect };
  updateRefactor(view);
  return root;
}

function createAuroraNode(view: AuroraNodeView): HTMLElement {
  const root = el("article", { className: "aurora-node" });
  root.dataset.state = view.state;
  const name = el("strong", { className: "aurora-node__name" });
  name.append(text(view.name));
  const stateText = text(t(`ui.aurora.nodeState.${view.state}`));
  const state = el("span", { className: "aurora-node__state" });
  state.append(stateText);
  root.append(name, state);
  auroraNodeRows.set(view.id, { root, state: stateText });
  return root;
}

function createResearchNode(view: ResearchNodeView, actions: AppActions): HTMLElement {
  const root = el("article", { className: "research-node" });
  const title = el("h3", { className: "research-node__title" });
  title.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createProjectButton("ui.research.buy", () => actions.buyResearch(view.id));

  root.append(
    title,
    createProjectMeta("ui.research.effect", effect),
    createProjectMeta("ui.research.cost", cost),
    createProjectMeta("ui.research.state", state),
    button
  );
  researchNodes.set(view.id, { button, cost, effect, root, state });
  updateResearchNode(view);
  return root;
}

function createInsightNode(view: InsightNodeView, actions: AppActions): HTMLElement {
  const root = el("article", { className: "insight-node" });
  const title = el("h3", { className: "insight-node__title" });
  title.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createProjectButton("ui.insight.buy", () => actions.buyInsightNode(view.id));

  root.append(
    title,
    createProjectMeta("ui.research.effect", effect),
    createProjectMeta("ui.research.cost", cost),
    createProjectMeta("ui.research.state", state),
    button
  );
  insightNodes.set(view.id, { button, cost, effect, root, state });
  updateInsightNode(view);
  return root;
}

function createEquityPerk(view: EquityPerkView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "upgrade-row equity-perk-row" });
  const name = el("strong", { className: "upgrade-row__name" });
  name.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createBuyButton("ui.exit.buyPerk", () => actions.buyEquityPerk(view.id));

  root.append(name, createValueCell(effect), createValueCell(cost), createValueCell(state), button);
  equityPerks.set(view.id, { button, cost, effect, root, state });
  updateEquityPerk(view);
  return root;
}

function createRunModifier(view: RunModifierView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "run-modifier-row" });
  const name = el("strong", { className: "run-modifier-row__name" });
  name.append(text(view.name));
  const description = text(view.description);
  const button = createBuyButton("ui.exit.selectModifier", () =>
    actions.selectRunModifier(view.id)
  );

  root.append(name, createValueCell(description), button);
  runModifiers.set(view.id, { button, description, root });
  updateRunModifier(view);
  return root;
}

function createParadoxItem(view: ParadoxItemView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "upgrade-row paradox-item-row" });
  const name = el("strong", { className: "upgrade-row__name" });
  name.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createBuyButton("ui.paradox.buyItem", () => actions.buyParadoxItem(view.id));

  root.append(name, createValueCell(effect), createValueCell(cost), createValueCell(state), button);
  paradoxItems.set(view.id, { button, cost, effect, root, state });
  updateParadoxItem(view);
  return root;
}

let refactorNodes: RefactorNodes | undefined;
let projectSummaryNodes: ProjectSummaryNodes | undefined;
let researchSummaryNodes: ResearchSummaryNodes | undefined;
let rewriteNodes: RewriteNodes | undefined;

function syncGeneratorRows(
  views: readonly GeneratorRowView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".agent-list");

  if (list !== null) {
    for (const view of views) {
      if (!generatorRows.has(view.id)) {
        list.append(createGeneratorRow(view, actions));
      }
    }
  }

  for (const view of views) {
    updateGeneratorRow(view);
  }
}

function updateGeneratorRow(view: GeneratorRowView): void {
  const row = generatorRows.get(view.id);

  if (row === undefined) {
    return;
  }

  row.root.classList.toggle("agent-row--locked", view.locked);
  setText(row.name, view.name);
  setText(row.owned, view.owned);
  setText(row.rate, view.rate);
  setText(row.cost1, view.cost1);
  setText(row.cost10, view.cost10);
  setText(row.milestone, view.milestoneLabel);
  row.milestoneBar.style.transform = `scaleX(${view.milestoneProgress.toFixed(3)})`;
  updateButton(row.buy1, view.canBuy1, view.buy1Title);
  updateButton(row.buy10, view.canBuy10, view.buy10Title);
  updateButton(row.buyMax, view.canBuyMax, view.buyMaxTitle);
}

function updateComputeBreakdown(view: ComputeBreakdownView): void {
  if (computeBreakdownNodes === undefined) {
    return;
  }

  setText(computeBreakdownNodes.used, view.used);
  setText(computeBreakdownNodes.cap, view.cap);
  setText(computeBreakdownNodes.remaining, view.remaining);

  const visibleIds = new Set<string>();
  for (const row of view.rows) {
    visibleIds.add(row.id);
    let nodes = computeRows.get(row.id);

    if (nodes === undefined) {
      computeBreakdownNodes.list.append(createComputeRow(row));
      nodes = computeRows.get(row.id);
    }

    if (nodes !== undefined) {
      nodes.root.hidden = false;
      setText(nodes.name, row.name);
      setText(nodes.used, row.used);
    }
  }

  for (const [id, nodes] of computeRows) {
    nodes.root.hidden = !visibleIds.has(id);
  }
}

function syncHardwareRows(
  views: readonly HardwareRowView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const visibleIds = new Set(views.map((view) => view.id));
  const phases: readonly HardwareRowView["phase"][] = ["pc", "server"];

  for (const phase of phases) {
    const phaseRows = views.filter((view) => view.phase === phase);
    const section = screen.querySelector<HTMLElement>(`.hardware-section[data-phase="${phase}"]`);
    const list = screen.querySelector<HTMLElement>(`.hardware-list[data-phase="${phase}"]`);

    if (section !== null) {
      section.hidden = phase === "server" && phaseRows.length === 0;
    }

    if (list === null) {
      continue;
    }

    for (const view of phaseRows) {
      if (!hardwareRows.has(view.id)) {
        list.append(createHardwareRow(view, actions));
      }
    }
  }

  for (const view of views) {
    updateHardwareRow(view);
  }

  for (const [id, nodes] of hardwareRows) {
    nodes.root.hidden = !visibleIds.has(id);
  }
}

function updateHardwareRow(view: HardwareRowView): void {
  const row = hardwareRows.get(view.id);

  if (row === undefined) {
    return;
  }

  row.root.dataset.phase = view.phase;
  row.root.dataset.slot = view.slot;
  row.root.classList.toggle("hardware-row--active", view.active);
  row.root.classList.toggle("hardware-row--enclosure", view.isEnclosure);
  setText(row.slot, view.slotLabel);
  setText(row.level, view.levelLabel);
  setText(row.cost, view.cost);
  setText(row.cap, view.capAdd);
  setText(row.power, view.powerCost);
  setText(row.requirement, view.psuRequirement);
  if (row.requirement.parentElement !== null) {
    row.requirement.parentElement.hidden = view.psuRequirement === "";
  }
  row.root.classList.toggle("hardware-row--blocked", view.psuRequirement !== "");
  row.buy.disabled = !view.canBuy;
}

function updateHardwareAuroraCounter(view: AuroraView): void {
  if (hardwareAuroraCounterNodes === undefined) {
    return;
  }

  hardwareAuroraCounterNodes.root.hidden = !view.unlocked || view.readyServerCount <= 0;
  setText(hardwareAuroraCounterNodes.value, view.readyServers);
}

function syncUpgradeRows(
  views: readonly UpgradeRowView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".upgrade-list");

  if (list === null) {
    return;
  }

  for (const view of views) {
    const row = upgradeRows.get(view.id);
    if (row === undefined) {
      list.append(createUpgradeRow(view, actions));
    } else {
      updateUpgradeRow(view);
    }
  }
}

function updateUpgradeRow(view: UpgradeRowView): void {
  const row = upgradeRows.get(view.id);

  if (row === undefined) {
    return;
  }

  setText(row.effect, view.effect);
  setText(row.cost, view.cost);
  setText(row.state, view.stateLabel);
  row.root.dataset.state = view.state;
  row.button.disabled = !view.canBuy;
}

function syncAutomationToggles(
  views: readonly AutomationToggleView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".automation-list");

  if (list !== null) {
    const missingIds = new Set(getMissingAutomationToggleIds(views, automationToggles.keys()));

    for (const view of views) {
      if (missingIds.has(view.id)) {
        list.append(createAutomationToggle(view, actions));
      }
    }
  }

  for (const view of views) {
    updateAutomationToggle(view);
  }
}

export function getMissingAutomationToggleIds(
  views: readonly Pick<AutomationToggleView, "id">[],
  existingIds: Iterable<string>
): string[] {
  const existing = new Set(existingIds);
  return views.filter((view) => !existing.has(view.id)).map((view) => view.id);
}

function updateAutomationToggle(view: AutomationToggleView): void {
  const nodes = automationToggles.get(view.id);

  if (nodes === undefined) {
    return;
  }

  setText(nodes.detail, view.detail);
  nodes.checkbox.disabled = view.disabled;
  nodes.root.classList.toggle("automation-toggle--locked", view.disabled);

  if (document.activeElement !== nodes.checkbox) {
    nodes.checkbox.checked = view.enabled;
  }
}

function updateProjects(
  view: ProjectsView,
  screens: { readonly projects: HTMLElement },
  actions: AppActions
): void {
  updateProjectSummary(view);
  updateRefactor(view.refactor);
  updateProjectOffers(view.offers);
  syncActiveBuilds(view.activeBuilds, screens.projects);
  syncProducts(view.portfolio, screens.projects, actions);
}

function updateAurora(view: AuroraView): void {
  if (auroraNodes === undefined) {
    return;
  }

  setText(auroraNodes.progressLabel, view.progressLabel);
  auroraNodes.progressBar.style.transform = `scaleX(${view.progress.toFixed(3)})`;
  setText(auroraNodes.phaseName, view.phaseName);
  setText(auroraNodes.status, view.statusLabel);
  setText(auroraNodes.costLoc, view.costLoc);
  setText(auroraNodes.costMoney, view.costMoney);
  setText(auroraNodes.timeRemaining, view.timeRemaining);
  setText(auroraNodes.requiredServers, view.requiredServers);
  setText(auroraNodes.availableServers, view.availableServers);
  setText(auroraNodes.readyServers, view.readyServers);
  setText(auroraNodes.dedicatedServers, view.dedicatedServers);
  setText(auroraNodes.hostedServers, view.hostedServers);
  setText(auroraNodes.hostingRate, view.hostingRate);
  auroraNodes.fund.disabled = !view.canFund;
  auroraNodes.dedicate.disabled = !view.canDedicate;
  auroraNodes.host.disabled = !view.canHost;

  for (const node of view.nodes) {
    const row = auroraNodeRows.get(node.id);
    if (row === undefined) {
      continue;
    }

    row.root.dataset.state = node.state;
    setText(row.state, t(`ui.aurora.nodeState.${node.state}`));
  }
}

function updateSettings(view: SettingsView): void {
  if (settingsNodes === undefined) {
    return;
  }

  const activeElement = document.activeElement;
  updateEditableSettingValue(
    settingsNodes.autosaveS,
    view.autosaveS,
    activeElement === settingsNodes.autosaveS
  );

  if (activeElement !== settingsNodes.notation) {
    settingsNodes.notation.value = view.notation;
  }

  if (activeElement !== settingsNodes.sound) {
    settingsNodes.sound.checked = view.sound;
  }

  if (activeElement !== settingsNodes.doNotDisturb) {
    settingsNodes.doNotDisturb.checked = view.doNotDisturb;
  }

  if (activeElement !== settingsNodes.glitch) {
    settingsNodes.glitch.checked = view.glitch;
  }

  if (activeElement !== settingsNodes.skipIntro) {
    settingsNodes.skipIntro.checked = view.skipIntro;
  }

  if (activeElement !== settingsNodes.vibexLocalAi) {
    settingsNodes.vibexLocalAi.checked = view.vibexLocalAi;
  }

  setText(settingsNodes.localAiStatus, view.localAiStatus);
  setText(
    settingsNodes.localAiProgress,
    t("ui.settings.vibexModelMeta", {
      progress: view.localAiProgress,
      size: view.localAiModelSize
    })
  );
  settingsNodes.downloadVibexModel.disabled = !view.localAiCanDownload;

  updateEditableSettingValue(
    settingsNodes.volume,
    view.volume,
    activeElement === settingsNodes.volume
  );

  if (activeElement !== settingsNodes.reducedFx) {
    settingsNodes.reducedFx.checked = view.reducedFx;
  }
}

function updateFullGame(view: FullGameView): void {
  if (fullGameNodes === undefined) {
    return;
  }

  fullGameNodes.root.hidden = !view.visible;
}

function updateStats(view: StatsView): void {
  for (const row of [...view.lifetimeRows, ...view.runRows, ...view.recordsRows]) {
    const nodes = statsRows.get(row.id);

    if (nodes !== undefined) {
      setText(nodes.value, row.value);
    }
  }

  if (statsNodes === undefined) {
    return;
  }

  statsNodes.svg.toggleAttribute("hidden", view.sparklineEmpty);
  statsNodes.empty.hidden = !view.sparklineEmpty;
  statsNodes.svg.setAttribute("aria-label", view.sparklineLabel);
  statsNodes.path.setAttribute("d", view.sparklinePath);
}

function updateAchievements(
  view: AchievementsView,
  screens: { readonly achievements: HTMLElement }
): void {
  if (achievementsNodes !== undefined) {
    setText(achievementsNodes.unlocked, view.unlocked);
    setText(achievementsNodes.bonus, view.bonus);

    for (const card of view.cards) {
      if (!achievementCards.has(card.id)) {
        achievementsNodes.grid.append(createAchievementCard(card));
      }
    }
  }

  for (const card of view.cards) {
    updateAchievementCard(card);
  }

  screens.achievements.classList.toggle(
    "achievements-screen--complete",
    view.cards.every((card) => card.unlocked)
  );
}

function updateAchievementCard(view: AchievementCardView): void {
  const nodes = achievementCards.get(view.id);

  if (nodes === undefined) {
    return;
  }

  nodes.root.classList.toggle("achievement-card--unlocked", view.unlocked);
  nodes.root.classList.toggle("achievement-card--locked", !view.unlocked);
  setText(nodes.category, view.category);
  setText(nodes.title, view.name);
  setText(nodes.description, view.description);
  setText(nodes.status, view.status);
}

function updateOffline(view: OfflineView): void {
  if (offlineNodes === undefined) {
    return;
  }

  offlineNodes.root.hidden = !view.visible;
  setText(offlineNodes.duration, view.duration);
  setText(offlineNodes.loc, view.loc);
  setText(offlineNodes.money, view.money);
  setText(offlineNodes.hype, view.hype);
}

function updateEndingModal(
  nodes: EndingModalNodes,
  view: EndingModalView,
  actions: AppActions
): void {
  nodes.root.hidden = !view.visible;

  if (!view.visible) {
    if (nodes.signature !== "hidden") {
      nodes.root.replaceChildren();
      nodes.signature = "hidden";
    }
    return;
  }

  const signature = getEndingModalSignature(view);
  if (nodes.signature === signature) {
    return;
  }

  const dialog = el("div", { className: "ending-modal__dialog" });
  const title = el("h2", { className: "ending-modal__title" });
  title.append(text(t("ui.ending.title")));
  const copy = el("div", { className: "ending-modal__copy" });
  for (const line of view.lines) {
    const paragraph = el("p", { className: "ending-modal__line" });
    paragraph.append(text(line));
    copy.append(paragraph);
  }

  const choices = el("div", { className: "ending-modal__choices" });
  for (const choice of view.choices) {
    const button = el("button", {
      className: "project-card__button",
      title: choice.label
    });
    button.type = "button";
    button.append(text(choice.label));
    button.addEventListener("click", () => {
      actions.chooseStoryChoice(view.eventId, choice.id);
    });
    button.disabled = choice.selected;
    choices.append(button);
  }

  dialog.append(title, copy, choices);
  nodes.root.replaceChildren(dialog);
  nodes.signature = signature;
}

function getEndingModalSignature(view: EndingModalView): string {
  return [
    view.eventId,
    ...view.lines,
    ...view.choices.map((choice) =>
      [choice.id, choice.label, choice.selected ? "1" : "0"].join(":")
    )
  ].join("|");
}

function updateResearch(view: ResearchView): void {
  if (researchSummaryNodes !== undefined) {
    setText(researchSummaryNodes.rp, view.rp);
  }

  for (const node of view.nodes) {
    updateResearchNode(node);
  }
}

function updateResearchNode(view: ResearchNodeView): void {
  const node = researchNodes.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
}

function updateRewrite(view: RewriteView): void {
  if (rewriteNodes === undefined) {
    return;
  }

  setText(rewriteNodes.insight, view.insight);
  setText(rewriteNodes.gain, view.preview.gain);
  setText(rewriteNodes.requiredInsight, view.preview.requiredInsight);
  setText(rewriteNodes.afterInsight, view.preview.afterInsight);
  setText(rewriteNodes.currentMultiplier, view.preview.currentMultiplier);
  setText(rewriteNodes.targetMultiplier, view.preview.targetMultiplier);
  setText(rewriteNodes.speedup, view.preview.speedup);
  setText(rewriteNodes.startMoney, view.preview.startMoney);
  setText(rewriteNodes.startEra, view.preview.startEra);
  setText(rewriteNodes.startGenerators, view.preview.startGenerators);
  setText(rewriteNodes.lostLoc, view.preview.lostLoc);
  setText(rewriteNodes.lostMoney, view.preview.lostMoney);
  setText(rewriteNodes.lostAgents, view.preview.lostAgents);
  setText(rewriteNodes.lostHardware, view.preview.lostHardware);
  setText(rewriteNodes.lostProducts, view.preview.lostProducts);
  setText(rewriteNodes.lostUpgrades, view.preview.lostUpgrades);
  rewriteNodes.boot.hidden = !view.preview.booting;
  if (view.preview.booting) {
    rewriteNodes.bootOverlay.hidden = rewriteNodes.bootOverlay.dataset.skipped === "1";
  } else {
    rewriteNodes.bootOverlay.hidden = true;
    delete rewriteNodes.bootOverlay.dataset.skipped;
  }
  rewriteNodes.button.disabled = !view.preview.canRewrite;

  for (const node of view.nodes) {
    updateInsightNode(node);
  }

  updateExit(view.exit);
  updateParadox(view.paradox);
}

function updateInsightNode(view: InsightNodeView): void {
  const node = insightNodes.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
}

function updateExit(view: ExitView): void {
  if (exitNodes !== undefined) {
    setText(exitNodes.currentEquity, view.preview.currentEquity);
    setText(exitNodes.gain, view.preview.gain);
    setText(exitNodes.requiredInsight, view.preview.requiredInsight);
    setText(exitNodes.totalInsightEarned, view.preview.totalInsightEarned);
    setText(exitNodes.equityAfter, view.preview.equityAfter);
    setText(exitNodes.currentMultiplier, view.preview.currentMultiplier);
    setText(exitNodes.targetMultiplier, view.preview.targetMultiplier);
    setText(exitNodes.rewardMultiplier, view.preview.rewardMultiplier);
    exitNodes.button.disabled = !view.preview.canExit;
  }

  for (const perk of view.perks) {
    updateEquityPerk(perk);
  }

  for (const modifier of view.runModifiers) {
    updateRunModifier(modifier);
  }
}

function updateEquityPerk(view: EquityPerkView): void {
  const node = equityPerks.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
}

function updateRunModifier(view: RunModifierView): void {
  const node = runModifiers.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.description, view.description);
  node.root.classList.toggle("run-modifier-row--active", view.active);
  node.root.classList.toggle("run-modifier-row--selected", view.selected);
  node.root.classList.toggle("run-modifier-row--locked", !view.unlocked);
  node.button.disabled = !view.unlocked || view.selected;
  node.button.textContent = t(
    view.selected ? "ui.exit.selectedModifier" : "ui.exit.selectModifier"
  );
}

function updateParadox(view: ParadoxView): void {
  if (paradoxNodes !== undefined) {
    paradoxNodes.root.hidden = !view.unlocked;
    setText(paradoxNodes.currentIteration, view.preview.currentIteration);
    setText(paradoxNodes.nextIteration, view.preview.nextIteration);
    setText(paradoxNodes.locRate, view.preview.locRate);
    setText(paradoxNodes.softcapThreshold, view.preview.softcapThreshold);
    setText(paradoxNodes.hold, view.preview.hold);
    setText(paradoxNodes.currentParadox, view.preview.currentParadox);
    setText(paradoxNodes.paradoxGain, view.preview.paradoxGain);
    setText(paradoxNodes.paradoxAfter, view.preview.paradoxAfter);
    setText(paradoxNodes.currentMultiplier, view.preview.currentMultiplier);
    setText(paradoxNodes.targetMultiplier, view.preview.targetMultiplier);
    setText(paradoxNodes.ruleSlots, view.ruleSlots);
    setText(paradoxNodes.theme, view.theme);
    paradoxNodes.button.disabled = !view.preview.canIterate;
  }

  for (const item of view.items) {
    updateParadoxItem(item);
  }
}

function updateParadoxItem(view: ParadoxItemView): void {
  const node = paradoxItems.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
}

export function updateProjectSummaryIncome(income: { data: string }, view: ProjectsView): void {
  if (income.data !== view.incomeRate) {
    income.data = view.incomeRate;
  }
}

export function updateEditableSettingValue(
  control: { defaultValue: string; value: string },
  value: string,
  focused: boolean
): void {
  if (focused) {
    return;
  }

  if (control.value !== value) {
    control.value = value;
  }

  if (control.defaultValue !== value) {
    control.defaultValue = value;
  }
}

function updateProjectSummary(view: ProjectsView): void {
  if (projectSummaryNodes === undefined) {
    return;
  }

  updateProjectSummaryIncome(projectSummaryNodes.income, view);
}

function updateProjectOffers(views: readonly ProjectOfferView[]): void {
  for (const view of views) {
    updateProjectOffer(view);
  }
}

function updateProjectOffer(view: ProjectOfferView): void {
  const row = projectOffers.get(view.id);

  if (row === undefined) {
    return;
  }

  setText(row.tag, view.tag);
  setText(row.cost, view.cost);
  setText(row.payout, view.payout);
  setText(row.revenue, view.revenue);
  setText(row.buildTime, view.buildTime);
  row.button.disabled = !view.canStart;
}

function syncActiveBuilds(views: readonly ActiveBuildView[], screen: HTMLElement): void {
  const list = screen.querySelector<HTMLElement>(".active-build-list");

  if (list === null) {
    return;
  }

  for (const [id, nodes] of activeBuilds) {
    if (!views.some((view) => view.id === id)) {
      nodes.root.remove();
      activeBuilds.delete(id);
    }
  }

  for (const view of views) {
    const nodes = activeBuilds.get(view.id);
    if (nodes === undefined) {
      list.append(createActiveBuild(view));
    } else {
      updateActiveBuild(view);
    }
  }
}

function updateActiveBuild(view: ActiveBuildView): void {
  const nodes = activeBuilds.get(view.id);

  if (nodes === undefined) {
    return;
  }

  setText(nodes.remaining, view.remaining);
  nodes.progress.style.transform = `scaleX(${view.progress.toFixed(3)})`;
}

function syncProducts(
  views: readonly ProductView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".portfolio-list");

  if (list === null) {
    return;
  }

  for (const view of views) {
    const nodes = products.get(view.id);
    if (nodes === undefined) {
      list.append(createProduct(view, actions));
    } else {
      updateProduct(view);
    }
  }
}

function updateProduct(view: ProductView): void {
  const nodes = products.get(view.id);

  if (nodes === undefined) {
    return;
  }

  setText(nodes.revenue, view.revenue);
  setText(nodes.status, view.status);
  nodes.fix.disabled = !view.canFix;
}

function updateRefactor(view: RefactorView): void {
  if (refactorNodes === undefined) {
    return;
  }

  setText(refactorNodes.debt, view.debt);
  setText(refactorNodes.cost, view.cost);
  setText(refactorNodes.effect, view.effect);
  refactorNodes.button.disabled = !view.canStart;
}

function createColumnLabel(labelKey: string): HTMLElement {
  const label = el("span", { className: "agent-list__label" });
  label.append(text(t(labelKey)));
  return label;
}

function createValueCell(value: Text): HTMLElement {
  const cell = el("span", { className: "agent-row__value" });
  cell.append(value);
  return cell;
}

function createCostCell(cost1: Text, cost10: Text): HTMLElement {
  const cell = el("span", { className: "agent-row__cost" });
  const separator = el("span", { className: "agent-row__cost-separator" });
  separator.append(text(t("ui.devfloor.costSeparator")));
  cell.append(cost1, separator, cost10);
  return cell;
}

function createMilestoneCell(label: Text, track: HTMLElement): HTMLElement {
  const cell = el("span", { className: "agent-row__milestone" });
  const labelNode = el("span", { className: "agent-row__milestone-label" });
  labelNode.append(label);
  cell.append(labelNode, track);
  return cell;
}

function createButtonCell(...buttons: HTMLButtonElement[]): HTMLElement {
  const cell = el("span", { className: "agent-row__buttons" });
  cell.append(...buttons);
  return cell;
}

function createBuyButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "agent-row__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function createProjectButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "project-card__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function createSettingsButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "settings-button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function createProjectMeta(labelKey: string, value: Text): HTMLElement {
  const row = el("div", { className: "project-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  row.append(label, output);
  return row;
}

function createRewriteMeta(labelKey: string, value: Text): HTMLElement {
  const row = el("div", { className: "rewrite-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  row.append(label, output);
  return row;
}

function createSettingsControl(labelKey: string, control: HTMLElement): HTMLElement {
  const row = el("label", { className: "settings-control" });
  const label = el("span", { className: "settings-control__label" });
  label.append(text(t(labelKey)));
  row.append(label, control);
  return row;
}

function createOption(value: SettingsNotation, labelKey: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.append(text(t(labelKey)));
  return option;
}

function createSummaryItem(labelKey: string, value: string): HTMLElement {
  const item = el("div", { className: "project-summary__item" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  const valueNode = text(value);
  output.append(valueNode);
  item.append(label, output);
  projectSummaryNodes = { income: valueNode };
  return item;
}

function createSummaryBadge(labelKey: string, value: string): HTMLElement {
  const item = el("div", { className: "research-summary__item" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  const valueNode = text(value);
  output.append(valueNode);
  item.append(label, output);
  researchSummaryNodes = { rp: valueNode };
  return item;
}

function createResearchConnections(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "research-tree__connections");
  svg.setAttribute("viewBox", "0 0 300 1000");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  for (const x of [50, 150, 250]) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("x2", String(x));
    line.setAttribute("y1", "68");
    line.setAttribute("y2", "948");
    line.setAttribute("class", "research-tree__line");
    svg.append(line);
  }

  return svg;
}

function updateButton(button: HTMLButtonElement, enabled: boolean, title: string): void {
  button.disabled = !enabled;
  button.title = title;
}

function createAppIcon(link: ScreenLink): Element {
  const src = appIconSources[link.appId];
  if (src === undefined) {
    return createIcon(link.iconPath);
  }

  const icon = el("img", { className: "dock__icon dock__icon--image" });
  icon.setAttribute("alt", "");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("decoding", "async");
  icon.setAttribute("draggable", "false");
  icon.src = src;
  return icon;
}

function createIcon(pathData: string): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "dock__icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");

  icon.append(path);
  return icon;
}
