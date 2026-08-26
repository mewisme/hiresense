import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';

export const BASELINE_OVERALL_MATCH_FORMULA_VERSION = 'weighted-components-v1';

export interface BaselineOverallComponentInput {
  code: string;
  score: number | null;
  status: string;
}

export interface BaselineOverallComponentScore {
  code: string;
  score: number | null;
  status: string;
  configuredWeight: string;
  effectiveWeight: string;
  weightedScore: number | null;
}

export interface BaselineOverallMatchScore {
  formulaVersion: typeof BASELINE_OVERALL_MATCH_FORMULA_VERSION;
  score: number | null;
  status: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN';
  configuredWeightTotal: string;
  scoredWeightTotal: string;
  components: BaselineOverallComponentScore[];
}

@Injectable()
export class BaselineOverallMatchingService {
  score(pipelineConfig: unknown, inputs: readonly BaselineOverallComponentInput[]): BaselineOverallMatchScore {
    const configured = this.parseWeights(pipelineConfig);
    const inputByCode = new Map(inputs.map((input) => [input.code.toUpperCase(), input] as const));
    const configuredWeightTotal = configured.reduce((total, component) => total.add(component.weight), new Prisma.Decimal(0));
    const scoredWeightTotal = configured.reduce((total, component) => inputByCode.get(component.code)?.score == null ? total : total.add(component.weight), new Prisma.Decimal(0));
    const components = configured.map((component) => {
      const input = inputByCode.get(component.code);
      const score = input?.score ?? null;
      const effectiveWeight = score == null || scoredWeightTotal.isZero() ? new Prisma.Decimal(0) : component.weight.div(scoredWeightTotal);
      const weightedScore = score == null ? null : Number(new Prisma.Decimal(score).mul(effectiveWeight).toDecimalPlaces(6).toString());
      return {
        code: component.code,
        score,
        status: input?.status ?? 'UNAVAILABLE',
        configuredWeight: component.weight.toString(),
        effectiveWeight: effectiveWeight.toDecimalPlaces(6).toString(),
        weightedScore,
      };
    });
    const score = scoredWeightTotal.isZero() ? null : Number(components.reduce((total, component) => total.add(component.weightedScore ?? 0), new Prisma.Decimal(0)).toDecimalPlaces(2).toFixed(2));
    const status = scoredWeightTotal.isZero() ? 'UNKNOWN' : scoredWeightTotal.equals(configuredWeightTotal) ? 'COMPLETE' : 'PARTIAL';
    return {
      formulaVersion: BASELINE_OVERALL_MATCH_FORMULA_VERSION,
      score,
      status,
      configuredWeightTotal: configuredWeightTotal.toString(),
      scoredWeightTotal: scoredWeightTotal.toString(),
      components,
    };
  }

  private parseWeights(config: unknown): Array<{ code: string; weight: Prisma.Decimal }> {
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Matching pipeline config must be an object');
    const components = (config as Record<string, unknown>).components;
    if (!components || typeof components !== 'object' || Array.isArray(components)) throw new Error('Matching pipeline components config is required');

    const result = Object.entries(components).map(([code, value]) => {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid matching component weight: ${code}`);
      return { code: code.toUpperCase(), weight: new Prisma.Decimal(value) };
    }).filter((component) => !component.weight.isZero());

    if (result.length === 0) throw new Error('Matching pipeline must have at least one weighted component');
    const total = result.reduce((sum, component) => sum.add(component.weight), new Prisma.Decimal(0));
    if (!total.equals(1)) throw new Error(`Matching component weights must sum to 1, received ${total.toString()}`);
    return result;
  }
}