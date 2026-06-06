type LooseRecord = Record<string, any>

interface QueryBuilder {
  withIndex(
    indexName: string,
    filter: (q: { eq(field: string, value: any): unknown }) => unknown,
  ): QueryBuilder
  first(): Promise<LooseRecord | null>
  collect(): Promise<LooseRecord[]>
}

interface HandlerCtx {
  db: {
    query(tableName: string): QueryBuilder
    insert(tableName: string, value: LooseRecord): Promise<string>
    patch(id: string, value: LooseRecord): Promise<void>
    get(id: string): Promise<LooseRecord | null>
  }
}

interface FunctionConfig {
  args: LooseRecord
  handler: (ctx: HandlerCtx, args: LooseRecord) => unknown
}

export function query<TConfig extends FunctionConfig>(config: TConfig): TConfig {
  return config
}

export function mutation<TConfig extends FunctionConfig>(config: TConfig): TConfig {
  return config
}
