// Integration checks run inside a single rolled-back transaction. No account,
// role, session or audit record created here becomes visible to other clients.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { scriptDatabase } from "./environment.ts";
import { createTeamUser, changeTeamUserRole, saveTeamRole, TeamError } from "../lib/auth/team-store.ts";
import { verifyPassword } from "../lib/auth/password.ts";

const pool = scriptDatabase();
const connection = await pool.getConnection();
const suffix = randomUUID();
const actorId = randomUUID();
// Each service transaction is a savepoint inside the test transaction.
const adapter = {
  getConnection: async () => ({
    execute: connection.execute.bind(connection),
    beginTransaction: async () => { await connection.query("SAVEPOINT team_test_action"); },
    commit: async () => { await connection.query("RELEASE SAVEPOINT team_test_action"); },
    rollback: async () => { await connection.query("ROLLBACK TO SAVEPOINT team_test_action"); },
    release: () => {},
  } as unknown as PoolConnection),
} as Pool;
const denied = (status: number) => (error: unknown) => error instanceof TeamError && error.status === status;
try {
  await connection.beginTransaction();
  await connection.execute("INSERT INTO admin_profiles (id, email, display_name, password_hash, role) VALUES (?, ?, 'Rollback-only test actor', 'unusable', 'administrator')", [actorId, `${suffix}@example.invalid`]);
  const role = await saveTeamRole(adapter, actorId, { name: `Test ${suffix}`, canPublish: true }, false);
  const user = await createTeamUser(adapter, actorId, { name: "Rollback-only member", email: `member-${suffix}@example.invalid`, password: "Only for this rollback test 42", role: role.id });
  const [users] = await connection.execute<RowDataPacket[]>("SELECT password_hash, role FROM admin_profiles WHERE id = ?", [user.id]);
  assert.equal(users[0].role, role.id);
  assert.equal(await verifyPassword("Only for this rollback test 42", users[0].password_hash), true);
  await assert.rejects(createTeamUser(adapter, actorId, { name: "Duplicate", email: `member-${suffix}@example.invalid`, password: "Duplicate password 42", role: "editor" }), denied(409));
  await assert.rejects(createTeamUser(adapter, actorId, { name: "Bad role", email: `bad-${suffix}@example.invalid`, password: "Long enough password 42", role: "missing" }), denied(422));
  await assert.rejects(saveTeamRole(adapter, user.id, { name: "Unauthorized", canPublish: true }, false), denied(403));
  await assert.rejects(changeTeamUserRole(adapter, user.id, { id: actorId, role: "editor", expectedRole: "administrator" }), denied(403));
  await assert.rejects(changeTeamUserRole(adapter, actorId, { id: actorId, role: "editor", expectedRole: "administrator" }), denied(422));
  await assert.rejects(saveTeamRole(adapter, actorId, { id: "editor", version: 1, name: "Editor", canPublish: true }, true), denied(422));
  await saveTeamRole(adapter, actorId, { id: role.id, version: 1, name: `Updated ${suffix}`, canPublish: false }, true);
  await assert.rejects(saveTeamRole(adapter, actorId, { id: role.id, version: 1, name: "Stale", canPublish: true }, true), denied(409));
  await changeTeamUserRole(adapter, actorId, { id: user.id, role: "editor", expectedRole: role.id });
  await assert.rejects(changeTeamUserRole(adapter, actorId, { id: user.id, role: "administrator", expectedRole: role.id }), denied(409));
  const [updated] = await connection.execute<RowDataPacket[]>("SELECT role FROM admin_profiles WHERE id = ?", [user.id]);
  assert.equal(updated[0].role, "editor");
  const [audit] = await connection.execute<RowDataPacket[]>("SELECT action, metadata FROM audit_logs WHERE actor = ?", [actorId]);
  assert.equal(audit.length, 4);
  assert.ok(!JSON.stringify(audit).includes("password"));
  console.log("PASS: real MariaDB account creation/password hashing, custom role updates, role assignment, duplicate/invalid/stale inputs, administrator-only writes, protected built-ins and self-demotion guard.");
} finally {
  await connection.rollback(); connection.release();
  const [remaining] = await pool.execute<RowDataPacket[]>("SELECT id FROM admin_profiles WHERE id = ?", [actorId]);
  assert.equal(remaining.length, 0);
  await pool.end();
  console.log("PASS: verification transaction rolled back; no test accounts or roles persisted.");
}
