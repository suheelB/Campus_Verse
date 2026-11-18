#!/usr/bin/env node
/**
 * Trusted operational provisioning for a college administrator.
 *
 * There is deliberately no public API that grants privileged roles. Run this
 * script from a machine that can reach the CampusVerse PostgreSQL container:
 *
 *   node scripts/grant-college-admin.mjs admin@demo-college.edu
 *
 * The user must already exist (register normally first). The role is scoped to
 * the user's own college. Grants are idempotent.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const email = (process.argv[2] || '').trim().toLowerCase()
if (!email) {
  console.error('Usage: node scripts/grant-college-admin.mjs <user-email>')
  process.exit(1)
}

const postgresUser = process.env.POSTGRES_USER || 'campusverse'
const postgresDb = process.env.POSTGRES_DB || 'campusverse'
const composeFile = process.env.DOCKER_COMPOSE_FILE || 'docker-compose.yml'

function psql(sql, variables = {}) {
  const args = [
    'compose',
    '-f',
    composeFile,
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
  for (const [key, value] of Object.entries(variables)) {
    args.push('-v', `${key}=${value}`)
  }
  return execFileSync('docker', args, { cwd: repoRoot, encoding: 'utf8', input: sql }).trim()
}

const existing = psql("SELECT id FROM users WHERE LOWER(email) = LOWER(:'email')", { email })
if (!existing) {
  console.error(`No CampusVerse user found for ${email}. Register the account first.`)
  process.exit(1)
}

psql(
  `INSERT INTO platform_role_assignments (user_id, role, college_id)
   SELECT id, 'COLLEGE_ADMIN', college_id
   FROM users
   WHERE LOWER(email) = LOWER(:'email')
   ON CONFLICT (user_id, role, college_id) DO NOTHING`,
  { email },
)

const granted = psql(
  `SELECT COUNT(*) FROM platform_role_assignments p
   JOIN users u ON u.id = p.user_id
   WHERE LOWER(u.email) = LOWER(:'email') AND p.role = 'COLLEGE_ADMIN'`,
  { email },
)

if (granted === '0') {
  console.error(`Could not grant COLLEGE_ADMIN to ${email}.`)
  process.exit(1)
}

console.log(`COLLEGE_ADMIN granted to ${email}. The user must sign in again or refresh the app to see admin tools.`)
