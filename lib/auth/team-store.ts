import { randomUUID } from "node:crypto";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { hashPassword } from "./password.ts";
import { createUserInput, changeUserRoleInput, roleInput, changeRoleInput } from "./roles.ts";

export class TeamError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

// Re-check the actor under a row lock, so account-management permission cannot
// change between authorizing the request and committing its writes.
async function transaction<T>(pool: Pool, actorId: string, run: (connection: PoolConnection) => Promise<T>) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [actors] = await connection.execute<RowDataPacket[]>("SELECT role FROM admin_profiles WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [actorId]);
    if (actors[0]?.role !== "administrator") throw new TeamError(403, "Only an administrator can manage accounts and roles.");
    const result = await run(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") throw new TeamError(409, "That email address or role name is already in use.");
    throw error;
  } finally { connection.release(); }
}

export async function createTeamUser(pool: Pool, actorId: string, input: unknown) {
  const parsed = createUserInput.safeParse(input);
  if (!parsed.success) throw new TeamError(422, "Enter a name, valid email, role and a password of 10–256 characters.");
  const { name, email, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);
  return transaction(pool, actorId, async (connection) => {
    const [roles] = await connection.execute<RowDataPacket[]>("SELECT id FROM admin_roles WHERE id = ? LOCK IN SHARE MODE", [role]);
    if (!roles.length) throw new TeamError(422, "Choose an existing role.");
    const id = randomUUID();
    await connection.execute("INSERT INTO admin_profiles (id, display_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)", [id, name, email, passwordHash, role]);
    await connection.execute("INSERT INTO audit_logs (actor, action, metadata) VALUES (?, 'user_created', ?)", [actorId, JSON.stringify({ userId: id, role })]);
    return { id };
  });
}

export async function changeTeamUserRole(pool: Pool, actorId: string, input: unknown) {
  const parsed = changeUserRoleInput.safeParse(input);
  if (!parsed.success) throw new TeamError(422, "Choose a valid account and role.");
  const { id, role, expectedRole } = parsed.data;
  // Keeping the signed-in administrator's own role fixed also prevents removing
  // the last administrator. Another administrator may change their role.
  if (id === actorId) throw new TeamError(422, "You cannot change your own role. Ask another administrator.");
  return transaction(pool, actorId, async (connection) => {
    const [roles] = await connection.execute<RowDataPacket[]>("SELECT id FROM admin_roles WHERE id = ? LOCK IN SHARE MODE", [role]);
    if (!roles.length) throw new TeamError(422, "Choose an existing role.");
    const [users] = await connection.execute<RowDataPacket[]>("SELECT role FROM admin_profiles WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [id]);
    if (!users.length) throw new TeamError(404, "That account is no longer available.");
    if (users[0].role !== expectedRole) throw new TeamError(409, "This account's role changed. Refresh the list before trying again.");
    await connection.execute("UPDATE admin_profiles SET role = ? WHERE id = ?", [role, id]);
    await connection.execute("DELETE FROM admin_sessions WHERE user_id = ?", [id]);
    await connection.execute("INSERT INTO audit_logs (actor, action, metadata) VALUES (?, 'user_role_changed', ?)", [actorId, JSON.stringify({ userId: id, from: expectedRole, to: role })]);
    return { id };
  });
}

export async function saveTeamRole(pool: Pool, actorId: string, input: unknown, update: boolean) {
  const parsed = (update ? changeRoleInput : roleInput).safeParse(input);
  if (!parsed.success) throw new TeamError(422, "Enter a role name of 2–80 characters and its publishing permission.");
  const { name, canPublish } = parsed.data;
  const id = "id" in parsed.data ? String(parsed.data.id) : `custom-${randomUUID()}`;
  const version = "version" in parsed.data ? parsed.data.version : 0;
  return transaction(pool, actorId, async (connection) => {
    if (update) {
      const [roles] = await connection.execute<RowDataPacket[]>("SELECT is_system, version FROM admin_roles WHERE id = ? FOR UPDATE", [id]);
      if (!roles.length) throw new TeamError(404, "That role is no longer available.");
      if (roles[0].is_system || ["administrator", "editor"].includes(id)) throw new TeamError(422, "Administrator and Editor are built-in roles and cannot be changed.");
      if (Number(roles[0].version) !== version) throw new TeamError(409, "This role changed. Refresh the list before trying again.");
      await connection.execute("UPDATE admin_roles SET name = ?, can_publish = ?, version = version + 1 WHERE id = ?", [name, canPublish, id]);
    } else {
      await connection.execute("INSERT INTO admin_roles (id, name, can_publish) VALUES (?, ?, ?)", [id, name, canPublish]);
    }
    await connection.execute("INSERT INTO audit_logs (actor, action, metadata) VALUES (?, ?, ?)", [actorId, update ? "role_updated" : "role_created", JSON.stringify({ roleId: id, name, canPublish })]);
    return { id };
  });
}
