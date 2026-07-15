/** JSON-RPC 2.0 协议类型定义 */

export type RPCMethod =
  | 'ping'
  | 'execute'
  | 'load_data'
  | 'query'
  | 'describe'
  | 'list_variables'
  | 'reset'

export interface RPCRequest {
  jsonrpc: '2.0'
  id: number
  method: RPCMethod
  params: Record<string, unknown>
}

export interface RPCError {
  code: number
  message: string
  traceback?: string
}

export interface RPCResponse {
  jsonrpc: '2.0'
  id: number | null
  result?: ExecuteResult | LoadDataResult | QueryResult | DescribeResult | string[] | string
  error?: RPCError
}

export interface ExecuteResult {
  stdout: string
  stderr: string
  result: unknown
  figures: object[]
}

export interface LoadDataResult {
  columns: string[]
  dtypes: Record<string, string>
  head: Record<string, unknown>[]
  describe: Record<string, unknown>
  shape: [number, number]
}

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
  shape: [number, number]
}

export interface DescribeResult {
  columns: string[]
  dtypes: Record<string, string>
  head: Record<string, unknown>[]
  describe: Record<string, unknown>
  shape: [number, number]
}
