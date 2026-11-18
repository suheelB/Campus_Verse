import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { APIRequestContext, APIResponse } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '../../..')

export const API_BASE = process.env.E2E_API_BASE || 'http://localhost:8080/api/v1'

export interface RegisteredUser {
  email: string
  password: string
  displayName: string
  collegeSlug: string
  token: string
  id: string
}

export async function registerViaApi(
  request: APIRequestContext,
  input: Omit<RegisteredUser, 'token' | 'id'>,
): Promise<RegisteredUser> {
  const response = await request.post(`${API_BASE}/auth/register`, {
    data: {
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      collegeSlug: input.collegeSlug,
    },
  })
  const body = await expectJson(response, 200, 'register user')
  const user = body.data?.user
  const token = body.data?.token
  if (!user?.id || !token) throw new Error(`Registration response missing user/token: ${JSON.stringify(body)}`)
  return { ...input, token, id: user.id }
}

// The API returns untyped JSON in the E2E layer; call this with a concrete
// interface when the shape matters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function expectJson(response: APIResponse, status: number, action: string): Promise<any> {
  const text = await response.text()
  if (response.status() !== status) {
    throw new Error(`${action} failed with ${response.status()}: ${text}`)
  }
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`${action} returned non-JSON: ${text}`)
  }
}

export function grantCollegeAdmin(email: string): void {
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/grant-college-admin.mjs'), email], {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  })
}

export function queryDatabase(sql: string, variables: Record<string, string> = {}): string {
  const postgresUser = process.env.POSTGRES_USER || 'campusverse'
  const postgresDb = process.env.POSTGRES_DB || 'campusverse'
  const args = [
    'compose',
    'exec',
    '-T',
    'postgres',
    'psql',
    '-U',
    postgresUser,
    '-d',
    postgresDb,
    '-v',
    'ON_ERROR_STOP=1',
    '-tA',
    '-f',
    '-',
  ]
  for (const [key, value] of Object.entries(variables)) args.push('-v', `${key}=${value}`)
  return execFileSync('docker', args, { cwd: repoRoot, encoding: 'utf8', input: sql }).trim()
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
