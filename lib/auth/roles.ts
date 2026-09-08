import { z } from "zod";

export const roleInput = z.object({
  name: z.string().trim().min(2).max(80),
  canPublish: z.boolean(),
}).strict();
export const createUserInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(10).max(256),
  role: z.string().min(1).max(80),
}).strict();
export const changeUserRoleInput = z.object({
  id: z.string().uuid(), role: z.string().min(1).max(80), expectedRole: z.string().min(1).max(80),
}).strict();
export const changeRoleInput = roleInput.extend({ id: z.string().min(1).max(80), version: z.number().int().positive() }).strict();

export type Role = { id: string; name: string; canPublish: boolean; isSystem: boolean; version: number };
export type TeamUser = { id: string; name: string; email: string; role: string };
export function permissionsForRole(role: string, canPublish: boolean) {
  return { manageUsers: role === "administrator", publish: role === "administrator" || (role !== "editor" && canPublish) };
}
