export interface BigParts {
  readonly e: number;
  readonly m: number;
}

export type BigInput = Big | BigParts | number | string;

const ADD_EXPONENT_CUTOFF = 15;
const MAX_NUMBER_EXPONENT = 308;
const MIN_NUMBER_EXPONENT = -324;
const NUMERIC_TOLERANCE_E = -12;

export class Big implements BigParts {
  e: number;
  m: number;

  constructor(m = 0, e = 0) {
    this.m = 0;
    this.e = 0;
    this.set(m, e);
  }

  static zero(): Big {
    return new Big();
  }

  static one(): Big {
    return new Big(1, 0);
  }

  static from(value: BigInput): Big {
    if (value instanceof Big) {
      return value.copy();
    }

    if (typeof value === "number") {
      return Big.fromNumber(value);
    }

    if (typeof value === "string") {
      return Big.fromString(value);
    }

    return new Big(value.m, value.e);
  }

  static fromNumber(value: number): Big {
    assertFinite(value, "value");

    if (value === 0) {
      return Big.zero();
    }

    const e = Math.floor(Math.log10(Math.abs(value)));
    return new Big(value / 10 ** e, e);
  }

  static fromString(value: string): Big {
    const trimmed = value.trim();
    const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:e([+-]?\d+))?$/i.exec(trimmed);

    if (match === null) {
      throw new Error(`Invalid Big string: ${value}`);
    }

    const mantissa = Number(match[1]);
    const exponent = match[2] === undefined ? 0 : Number(match[2]);
    return new Big(mantissa, exponent);
  }

  static fromLog10(logValue: number, sign = 1): Big {
    assertFinite(logValue, "logValue");

    if (sign === 0) {
      return Big.zero();
    }

    const e = Math.floor(logValue);
    return new Big(Math.sign(sign) * 10 ** (logValue - e), e);
  }

  static cost(baseCost: BigInput, growth: number, owned: number): Big {
    assertGrowth(growth);
    assertNonNegativeInteger(owned, "owned");

    return Big.mul(Big.from(baseCost), Big.powNumber(growth, owned));
  }

  static bulkCost(baseCost: BigInput, growth: number, owned: number, quantity: number): Big {
    assertGrowth(growth);
    assertNonNegativeInteger(owned, "owned");
    assertNonNegativeInteger(quantity, "quantity");

    if (quantity === 0) {
      return Big.zero();
    }

    if (growth === 1) {
      return Big.mul(Big.from(baseCost), Big.fromNumber(quantity));
    }

    const firstCost = Big.cost(baseCost, growth, owned);
    const growthSeries = Big.sub(Big.powNumber(growth, quantity), Big.one());
    return Big.div(Big.mul(firstCost, growthSeries), Big.fromNumber(growth - 1));
  }

  static maxAffordable(
    baseCost: BigInput,
    growth: number,
    owned: number,
    budget: BigInput
  ): number {
    assertGrowth(growth);
    assertNonNegativeInteger(owned, "owned");

    const available = Big.from(budget);
    if (available.m <= 0) {
      return 0;
    }

    const base = Big.from(baseCost);
    if (base.m <= 0) {
      throw new Error("baseCost must be positive");
    }

    if (growth === 1) {
      return Math.floor(Big.div(available, base).toNumber());
    }

    const denominator = Big.mul(base, Big.powNumber(growth, owned));
    const scaled = Big.div(Big.mul(available, Big.fromNumber(growth - 1)), denominator);
    const estimate =
      scaled.e <= ADD_EXPONENT_CUTOFF
        ? Math.floor(Math.log(scaled.toNumber() + 1) / Math.log(growth))
        : Math.floor(scaled.log10() / Math.log10(growth));

    let affordable = Math.max(0, estimate);

    while (
      affordable > 0 &&
      Big.gtBeyondTolerance(Big.bulkCost(base, growth, owned, affordable), available)
    ) {
      affordable -= 1;
    }

    while (Big.lteWithinTolerance(Big.bulkCost(base, growth, owned, affordable + 1), available)) {
      affordable += 1;
    }

    return affordable;
  }

  static add(left: BigInput, right: BigInput): Big {
    return Big.addIn(Big.from(left), Big.from(right));
  }

  static addIn(target: Big, addend: Big): Big {
    return Big.addSignedIn(target, addend, 1);
  }

  static sub(left: BigInput, right: BigInput): Big {
    return Big.subIn(Big.from(left), Big.from(right));
  }

  static subIn(target: Big, subtrahend: Big): Big {
    return Big.addSignedIn(target, subtrahend, -1);
  }

  static mul(left: BigInput, right: BigInput): Big {
    return Big.mulIn(Big.from(left), Big.from(right));
  }

  static mulIn(target: Big, multiplier: Big): Big {
    if (target.eq0() || multiplier.eq0()) {
      return target.set(0, 0);
    }

    return target.set(target.m * multiplier.m, target.e + multiplier.e);
  }

  static div(left: BigInput, right: BigInput): Big {
    return Big.divIn(Big.from(left), Big.from(right));
  }

  static divIn(target: Big, divisor: Big): Big {
    if (divisor.eq0()) {
      throw new Error("Cannot divide Big by zero");
    }

    if (target.eq0()) {
      return target;
    }

    return target.set(target.m / divisor.m, target.e - divisor.e);
  }

  static pow(base: BigInput, exponent: number): Big {
    assertFinite(exponent, "exponent");

    if (exponent === 0) {
      return Big.one();
    }

    const b = Big.from(base);
    if (b.eq0()) {
      if (exponent < 0) {
        throw new Error("Cannot raise zero Big to a negative exponent");
      }

      return Big.zero();
    }

    if (b.m < 0 && !Number.isInteger(exponent)) {
      throw new Error("Cannot raise a negative Big to a fractional exponent");
    }

    const sign = b.m < 0 && Math.abs(exponent % 2) === 1 ? -1 : 1;
    const logValue = (Math.log10(Math.abs(b.m)) + b.e) * exponent;
    return Big.fromLog10(logValue, sign);
  }

  static powBig(base: BigInput, exponent: BigInput): Big {
    return Big.pow(base, Big.from(exponent).toNumber());
  }

  static powNumber(base: number, exponent: number): Big {
    assertFinite(base, "base");
    assertFinite(exponent, "exponent");

    if (base <= 0) {
      throw new Error("base must be positive");
    }

    return Big.fromLog10(Math.log10(base) * exponent);
  }

  static cmp(left: BigInput, right: BigInput): number {
    return Big.from(left).cmp(Big.from(right));
  }

  static max(left: BigInput, right: BigInput): Big {
    const a = Big.from(left);
    const b = Big.from(right);
    return a.gte(b) ? a : b;
  }

  static min(left: BigInput, right: BigInput): Big {
    const a = Big.from(left);
    const b = Big.from(right);
    return a.lte(b) ? a : b;
  }

  static floor(value: BigInput): Big {
    return Big.floorIn(Big.from(value));
  }

  static floorIn(target: Big): Big {
    if (target.eq0()) {
      return target;
    }

    if (target.e < 0) {
      return target.set(target.m < 0 ? -1 : 0, 0);
    }

    if (target.e >= ADD_EXPONENT_CUTOFF) {
      return target;
    }

    return target.set(Math.floor(target.toNumber()), 0);
  }

  copy(): Big {
    return new Big(this.m, this.e);
  }

  set(m: number, e: number): this {
    assertFinite(m, "m");
    assertFinite(e, "e");

    if (m === 0) {
      this.m = 0;
      this.e = 0;
      return this;
    }

    const shift = Math.floor(Math.log10(Math.abs(m)));
    this.m = m / 10 ** shift;
    this.e = e + shift;

    if (Math.abs(this.m) >= 10) {
      this.m /= 10;
      this.e += 1;
    }

    if (Math.abs(this.m) < 1) {
      this.m *= 10;
      this.e -= 1;
    }

    if (Object.is(this.m, -0)) {
      this.m = 0;
      this.e = 0;
    }

    return this;
  }

  add(other: BigInput): Big {
    return Big.add(this, other);
  }

  addIn(other: Big): this {
    Big.addIn(this, other);
    return this;
  }

  sub(other: BigInput): Big {
    return Big.sub(this, other);
  }

  subIn(other: Big): this {
    Big.subIn(this, other);
    return this;
  }

  mul(other: BigInput): Big {
    return Big.mul(this, other);
  }

  mulIn(other: Big): this {
    Big.mulIn(this, other);
    return this;
  }

  div(other: BigInput): Big {
    return Big.div(this, other);
  }

  divIn(other: Big): this {
    Big.divIn(this, other);
    return this;
  }

  neg(): Big {
    return new Big(-this.m, this.e);
  }

  abs(): Big {
    return this.m < 0 ? this.neg() : this.copy();
  }

  floor(): Big {
    return Big.floor(this);
  }

  log10(): number {
    if (this.m <= 0) {
      throw new Error("log10 is only defined for positive Big values");
    }

    return Math.log10(this.m) + this.e;
  }

  cmp(other: Big): number {
    if (this.m === other.m && this.e === other.e) {
      return 0;
    }

    if (this.m === 0) {
      return other.m > 0 ? -1 : 1;
    }

    if (other.m === 0) {
      return this.m > 0 ? 1 : -1;
    }

    if (Math.sign(this.m) !== Math.sign(other.m)) {
      return this.m > other.m ? 1 : -1;
    }

    const sign = Math.sign(this.m);
    const absCmp = Big.cmpAbs(this, other);
    return sign > 0 ? absCmp : -absCmp;
  }

  eq(other: Big): boolean {
    return this.cmp(other) === 0;
  }

  eq0(): boolean {
    return this.m === 0;
  }

  gt(other: Big): boolean {
    return this.cmp(other) > 0;
  }

  gte(other: Big): boolean {
    return this.cmp(other) >= 0;
  }

  lt(other: Big): boolean {
    return this.cmp(other) < 0;
  }

  lte(other: Big): boolean {
    return this.cmp(other) <= 0;
  }

  toNumber(): number {
    if (this.eq0()) {
      return 0;
    }

    if (this.e > MAX_NUMBER_EXPONENT) {
      return Math.sign(this.m) * Number.MAX_VALUE;
    }

    if (this.e < MIN_NUMBER_EXPONENT) {
      return 0;
    }

    return this.m * 10 ** this.e;
  }

  toString(): string {
    if (this.eq0()) {
      return "0e0";
    }

    return `${trimMantissa(this.m)}e${this.e}`;
  }

  toJSON(): string {
    return this.toString();
  }

  private static addSignedIn(target: Big, other: Big, otherSign: 1 | -1): Big {
    if (other.eq0()) {
      return target;
    }

    if (target.eq0()) {
      return target.set(other.m * otherSign, other.e);
    }

    if (Math.abs(target.e - other.e) > ADD_EXPONENT_CUTOFF) {
      if (Big.cmpAbs(target, other) >= 0) {
        return target;
      }

      return target.set(other.m * otherSign, other.e);
    }

    const e = Math.max(target.e, other.e);
    const m = target.m * 10 ** (target.e - e) + other.m * otherSign * 10 ** (other.e - e);
    return target.set(m, e);
  }

  private static cmpAbs(left: Big, right: Big): number {
    if (left.eq0() && right.eq0()) {
      return 0;
    }

    if (left.eq0()) {
      return -1;
    }

    if (right.eq0()) {
      return 1;
    }

    if (left.e !== right.e) {
      return left.e > right.e ? 1 : -1;
    }

    const leftM = Math.abs(left.m);
    const rightM = Math.abs(right.m);
    return leftM === rightM ? 0 : leftM > rightM ? 1 : -1;
  }

  private static gtBeyondTolerance(left: Big, right: Big): boolean {
    if (!left.gt(right)) {
      return false;
    }

    if (right.eq0()) {
      return !left.eq0();
    }

    const diff = Big.sub(left, right).abs();
    return diff.log10() - right.abs().log10() > NUMERIC_TOLERANCE_E;
  }

  private static lteWithinTolerance(left: Big, right: Big): boolean {
    return !Big.gtBeyondTolerance(left, right);
  }
}

export function big(value: BigInput): Big {
  return Big.from(value);
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
}

function assertGrowth(growth: number): void {
  assertFinite(growth, "growth");

  if (growth < 1) {
    throw new Error("growth must be at least 1");
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
}

function trimMantissa(value: number): string {
  return value
    .toPrecision(15)
    .replace(/(\.\d*?)0+e/, "$1e")
    .replace(/\.?0+$/, "");
}
