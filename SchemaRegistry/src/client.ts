export class PisigmaSchemaRegistry {
  constructor(private baseUrl: string) {}
  
  async health() {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }
}
