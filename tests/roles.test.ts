import { test } from "node:test";
import assert from "node:assert/strict";
import { permissionsForRole, createUserInput, roleInput, changeUserRoleInput } from "../lib/auth/roles.ts";

test("only administrators manage accounts; Editor cannot publish even with malformed stored permission", () => {
  assert.deepEqual(permissionsForRole("administrator", false), { manageUsers: true, publish: true });
  assert.deepEqual(permissionsForRole("editor", true), { manageUsers: false, publish: false });
  assert.deepEqual(permissionsForRole("custom-publisher", true), { manageUsers: false, publish: true });
  assert.deepEqual(permissionsForRole("custom-writer", false), { manageUsers: false, publish: false });
});
test("account input normalizes email, validates passwords, and rejects unexpected privilege fields", () => {
  const account = { name: " Team member ", email: "Member@Example.COM", password: "A long password 42", role: "editor" };
  assert.equal(createUserInput.parse(account).email, "member@example.com");
  assert.equal(createUserInput.parse(account).name, "Team member");
  for (const input of [{ ...account, password: "short" }, { ...account, email: "invalid" }, { ...account, manageUsers: true }]) assert.equal(createUserInput.safeParse(input).success, false);
  assert.equal(roleInput.safeParse({ name: "Publisher", canPublish: true, manageUsers: true }).success, false);
  assert.equal(roleInput.safeParse({ name: " ", canPublish: true }).success, false);
  assert.equal(changeUserRoleInput.safeParse({ id: "invalid", role: "administrator", expectedRole: "editor" }).success, false);
});
