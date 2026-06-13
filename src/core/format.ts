import { Big, type BigInput } from "./bignum";

export type NumberNotation = "sci" | "suffix";

const SHORT_SUFFIXES = [
  { e: 12, suffix: "T" },
  { e: 9, suffix: "B" },
  { e: 6, suffix: "M" }
] as const;

const LETTER_SUFFIX_START_E = 15;
const EXPONENT_STEP = 3;
const SIGNIFICANT_DIGITS = 3;

export function formatBig(value: BigInput, notation: NumberNotation = "sci"): string {
  const big = Big.from(value);
  const sign = big.m < 0 ? "-" : "";
  const abs = big.abs();

  if (abs.e < 6) {
    return `${sign}${formatFull(abs.toNumber())}`;
  }

  if (abs.e < LETTER_SUFFIX_START_E) {
    const suffix = SHORT_SUFFIXES.find((entry) => abs.e >= entry.e);

    if (suffix === undefined) {
      return `${sign}${formatFull(abs.toNumber())}`;
    }

    const scaled = abs.m * 10 ** (abs.e - suffix.e);
    return `${sign}${formatSignificant(scaled)}${suffix.suffix}`;
  }

  return notation === "suffix" ? formatLetterSuffix(abs, sign) : formatScientific(abs, sign);
}

export function formatTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const secondsPerMinute = 60;
  const secondsPerHour = 60 * secondsPerMinute;
  const secondsPerDay = 24 * secondsPerHour;

  if (wholeSeconds >= secondsPerDay) {
    const days = Math.floor(wholeSeconds / secondsPerDay);
    const hours = Math.floor((wholeSeconds % secondsPerDay) / secondsPerHour);
    return `${days}d ${hours}h`;
  }

  if (wholeSeconds >= secondsPerHour) {
    const hours = Math.floor(wholeSeconds / secondsPerHour);
    const minutes = Math.floor((wholeSeconds % secondsPerHour) / secondsPerMinute);
    return `${hours}h ${minutes}m`;
  }

  if (wholeSeconds >= secondsPerMinute) {
    const minutes = Math.floor(wholeSeconds / secondsPerMinute);
    const remainingSeconds = wholeSeconds % secondsPerMinute;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${wholeSeconds}s`;
}

function formatScientific(value: Big, sign: string): string {
  return `${sign}${formatSignificant(value.m)}e${value.e}`;
}

function formatLetterSuffix(value: Big, sign: string): string {
  let suffixExponent = Math.floor(value.e / EXPONENT_STEP) * EXPONENT_STEP;
  let scaled = value.m * 10 ** (value.e - suffixExponent);

  if (Number(formatSignificant(scaled)) >= 1000) {
    suffixExponent += EXPONENT_STEP;
    scaled /= 1000;
  }

  const suffixIndex = suffixExponent / EXPONENT_STEP - LETTER_SUFFIX_START_E / EXPONENT_STEP;
  return `${sign}${formatSignificant(scaled)}${letterSuffix(suffixIndex)}`;
}

function formatFull(value: number): string {
  const rounded = Math.round(value);
  const integer = String(rounded);
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatSignificant(value: number): string {
  const abs = Math.abs(value);
  const digitsBeforeDecimal = abs >= 1 ? Math.floor(Math.log10(abs)) + 1 : 1;
  const fractionDigits = Math.max(0, SIGNIFICANT_DIGITS - digitsBeforeDecimal);
  return value.toFixed(fractionDigits);
}

function letterSuffix(index: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let n = Math.max(0, Math.floor(index));
  let suffix = "";

  do {
    suffix = alphabet[n % alphabet.length] + suffix;
    n = Math.floor(n / alphabet.length);
  } while (n > 0);

  return suffix.padStart(2, "a");
}
