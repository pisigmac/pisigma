import { WAFRule, WAFEvaluation, WAFResult } from './types';

export class PisigmaWAF {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8824') {
    this.baseUrl = baseUrl;
  }

  async evaluate(req: WAFEvaluation): Promise<WAFResult> {
    const res = await fetch(`${this.baseUrl}/v1/waf/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return res.json() as Promise<WAFResult>;
  }

  async createRule(rule: Partial<WAFRule>): Promise<WAFRule> {
    const res = await fetch(`${this.baseUrl}/v1/waf/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    return res.json() as Promise<WAFRule>;
  }

  async listRules(): Promise<WAFRule[]> {
    const res = await fetch(`${this.baseUrl}/v1/waf/rules`);
    return res.json() as Promise<WAFRule[]>;
  }

  async threats(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/v1/waf/threats`);
    return res.json() as Promise<any>;
  }
}
