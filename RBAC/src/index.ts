import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CanRequest, CanResponse, CreateRoleRequest, Env, Role } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const rolesStore = new Map<string, Role>([
  [
    'admin',
    {
      name: 'admin',
      description: 'Super administrator with full system access',
      permissions: ['*'],
    },
  ],
  [
    'editor',
    {
      name: 'editor',
      description: 'Content editor role with read/write access',
      permissions: ['read', 'write', 'edit', 'documents:*'],
    },
  ],
  [
    'viewer',
    {
      name: 'viewer',
      description: 'Read-only viewer role',
      permissions: ['read', 'documents:read'],
    },
  ],
])

// Pre-assigned user roles mapping for evaluation
const userRolesMap = new Map<string, string[]>([
  ['usr_admin', ['admin']],
  ['usr_editor', ['editor']],
  ['usr_viewer', ['viewer']],
])

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-rbac',
    environment: c.env?.RBAC_ENV || 'development',
    total_roles: rolesStore.size,
  })
})

app.get('/v1/rbac/roles', (c) => {
  return c.json({
    roles: Array.from(rolesStore.values()),
  })
})

app.post('/v1/rbac/roles', async (c) => {
  const body = await c.req.json<CreateRoleRequest>().catch(() => ({} as CreateRoleRequest))
  const { name, description, permissions } = body

  if (!name || typeof name !== 'string') {
    return c.json({ success: false, error: 'Role name is required' }, 400)
  }

  if (!permissions || !Array.isArray(permissions)) {
    return c.json({ success: false, error: 'Permissions array is required' }, 400)
  }

  const role: Role = {
    name: name.toLowerCase().trim(),
    description: description || '',
    permissions,
  }

  rolesStore.set(role.name, role)

  return c.json({
    success: true,
    role,
  })
})

app.post('/v1/rbac/can', async (c) => {
  const body = await c.req.json<CanRequest>().catch(() => ({} as CanRequest))
  const { user_id, action, resource } = body

  if (!action) {
    return c.json({ allowed: false, error: 'action is required' }, 400)
  }

  // Determine active roles: explicitly provided roles or looked up user roles
  let activeRoleNames: string[] = []
  if (body.roles && Array.isArray(body.roles) && body.roles.length > 0) {
    activeRoleNames = body.roles
  } else if (user_id) {
    activeRoleNames = userRolesMap.get(user_id) || []
  }

  if (activeRoleNames.length === 0) {
    return c.json<CanResponse>({
      allowed: false,
      user_id,
      action,
      resource,
      reason: 'No roles assigned or provided',
    })
  }

  const fullTargetAction = resource ? `${resource}:${action}` : action

  for (const roleName of activeRoleNames) {
    const role = rolesStore.get(roleName.toLowerCase())
    if (!role) continue

    for (const perm of role.permissions) {
      if (
        perm === '*' ||
        perm === action ||
        perm === fullTargetAction ||
        (resource && perm === `${resource}:*`)
      ) {
        return c.json<CanResponse>({
          allowed: true,
          user_id,
          action,
          resource,
          matched_role: role.name,
          reason: `Granted by permission standard check: ${perm}`,
        })
      }
    }
  }

  return c.json<CanResponse>({
    allowed: false,
    user_id,
    action,
    resource,
    reason: 'Permission denied by RBAC evaluation',
  })
})

export default app
