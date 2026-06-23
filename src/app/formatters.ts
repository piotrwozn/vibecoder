import { formatBig } from "../core/format";
import type { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { GENERATORS } from "../data/generators";
import { t } from "../i18n/i18n";
import type { VibexAiSnapshot } from "../platform/ai";

const SPARKLINE_WIDTH = 300;
const SPARKLINE_HEIGHT = 80;
const SPARKLINE_PADDING = 6;

export interface AppFormatters {
  createSparklinePath(samples: readonly Big[]): string;
  formatCompute(value: number): string;
  formatCount(statKey: string): string;
  formatEquity(value: number): string;
  formatHardwareLevel(level: number, maxLevel: number): string;
  formatHardwarePowerRate(value: Big): string;
  formatInsight(value: Big): string;
  formatInsightAmount(value: number): string;
  formatLinesOfCode(value: Big): string;
  formatLoc(value: Big): string;
  formatMoney(value: Big): string;
  formatMoneyRate(value: Big): string;
  formatMultiplier(value: number): string;
  formatParadox(value: number): string;
  formatParadoxAmount(value: number): string;
  formatPerSecond(value: Big): string;
  formatProjectLevel(level: number, maxLevel: number): string;
  formatRp(value: number): string;
  formatStartGenerators(generators: Readonly<Record<string, number>>): string;
  formatVibexAiProgress(ai: VibexAiSnapshot): string;
  formatVibexAiStatus(ai: VibexAiSnapshot): string;
  getNumericStat(key: string): number;
  getTotalGeneratorCount(): number;
}

export function createAppFormatters(getState: () => GameState): AppFormatters {
  const formatMultiplier = (value: number): string => `${value.toFixed(2)}x`;

  const getNumericStat = (key: string): number => {
    const value = getState().stats[key];
    return typeof value === "number" ? value : 0;
  };

  const formatCount = (statKey: string): string => String(getNumericStat(statKey));

  const formatLoc = (value: Big): string =>
    t("ui.format.loc", { value: formatBig(value, getState().settings.notation) });

  const formatLinesOfCode = (value: Big): string =>
    t("ui.format.linesOfCode", { value: formatBig(value, getState().settings.notation) });

  const formatMoney = (value: Big): string =>
    t("ui.format.money", { value: formatBig(value, getState().settings.notation) });

  const formatMoneyRate = (value: Big): string =>
    t("ui.format.perSecond", { value: formatMoney(value) });

  const formatHardwarePowerRate = (value: Big): string => {
    const abs = value.abs();

    if (!abs.eq0() && abs.e < 0) {
      const precise = abs
        .toNumber()
        .toFixed(4)
        .replace(/\.?0+$/u, "");
      return t("ui.format.perSecond", {
        value: t("ui.format.money", { value: precise })
      });
    }

    return formatMoneyRate(value);
  };

  const formatPerSecond = (value: Big): string =>
    t("ui.format.perSecond", { value: formatBig(value, getState().settings.notation) });

  const formatRp = (value: number): string => t("ui.format.rp", { value });

  const formatInsight = (value: Big): string =>
    t("ui.format.insight", { value: formatBig(value, getState().settings.notation) });

  const formatInsightAmount = (value: number): string => {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return t("ui.format.insight", { value: formatted });
  };

  const formatEquity = (value: number): string => {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return t("ui.format.equity", { value: formatted });
  };

  const formatParadox = (value: number): string => {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return t("ui.format.paradox", { value: formatted });
  };

  const formatParadoxAmount = (value: number): string => {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return t("ui.format.paradox", { value: formatted });
  };

  const formatStartGenerators = (generators: Readonly<Record<string, number>>): string => {
    const entries = Object.entries(generators).filter(([, count]) => count > 0);
    return entries.length === 0
      ? t("ui.rewrite.startGeneratorsNone")
      : entries
          .map(([id, count]) => {
            const generator = GENERATORS.find((entry) => entry.id === id);
            return `${count} ${generator === undefined ? id : t(generator.nameKey)}`;
          })
          .join(", ");
  };

  const formatCompute = (value: number): string =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);

  const formatHardwareLevel = (level: number, maxLevel: number): string =>
    Number.isFinite(maxLevel)
      ? t("ui.hardware.levelFinite", { level, max: maxLevel })
      : t("ui.hardware.levelInfinite", { level });

  const formatProjectLevel = (level: number, maxLevel: number): string =>
    t("ui.projects.levelValue", { level, max: maxLevel });

  const formatVibexAiProgress = (ai: VibexAiSnapshot): string => {
    if (ai.progress === undefined) {
      return "";
    }

    if (ai.progress.total <= 0) {
      return t("vibex.ai.progressUnknown");
    }

    return t("vibex.ai.progress", {
      percent: Math.floor((ai.progress.loaded / ai.progress.total) * 100)
    });
  };

  const truncateStatusMessage = (message: string): string => {
    const normalized = message.replace(/\s+/g, " ").trim();

    if (normalized.length <= 72) {
      return normalized;
    }

    return `${normalized.slice(0, 69)}...`;
  };

  const formatVibexAiStatus = (ai: VibexAiSnapshot): string => {
    if (ai.status !== "error" || ai.errorMessage === undefined || ai.errorMessage.length === 0) {
      return t(`vibex.ai.status.${ai.status}`);
    }

    return t("vibex.ai.status.errorDetail", {
      message: truncateStatusMessage(ai.errorMessage)
    });
  };

  const createSparklinePath = (samples: readonly Big[]): string => {
    if (samples.length < 2) {
      return "";
    }

    const values = samples.map((sample) => (sample.eq0() ? 0 : sample.log10()));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const width = SPARKLINE_WIDTH - SPARKLINE_PADDING * 2;
    const height = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2;

    return values
      .map((value, index) => {
        const x = SPARKLINE_PADDING + (index / Math.max(1, values.length - 1)) * width;
        const y = SPARKLINE_PADDING + (1 - (value - min) / range) * height;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const getTotalGeneratorCount = (): number =>
    Object.values(getState().owned.generators).reduce((total, count) => total + count, 0);

  return {
    createSparklinePath,
    formatCompute,
    formatCount,
    formatEquity,
    formatHardwareLevel,
    formatHardwarePowerRate,
    formatInsight,
    formatInsightAmount,
    formatLinesOfCode,
    formatLoc,
    formatMoney,
    formatMoneyRate,
    formatMultiplier,
    formatParadox,
    formatParadoxAmount,
    formatPerSecond,
    formatProjectLevel,
    formatRp,
    formatStartGenerators,
    formatVibexAiProgress,
    formatVibexAiStatus,
    getNumericStat,
    getTotalGeneratorCount
  };
}
