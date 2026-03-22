// ============================================================
// types/access-manager.ts
// Shared types for AccessManagerPanel (platform + token scopes)
// ============================================================

export type AccessManagerScope = "platform" | "token";

export interface AMRoleAssignment {
  roleKey: string;
  roleLabel: string;
  grantedAt: string;
}

export interface AMMember {
  id: string;
  walletAddress: string;
  displayName?: string;
  email?: string;
  isActive: boolean;
  assignments: AMRoleAssignment[];
}

export interface AMRoleDef {
  id: string;
  key: string;
  label: string;
  description: string;
  sensitive?: boolean;
}

/** Alias for ABI engine / contract forms (role id as string or bigint-compatible). */
export type RoleDefinition = AMRoleDef;

export interface HierarchyNode {
  id: string;
  parentId: string | null;
  label: string;
  description?: string;
}

export interface ScheduledOp {
  id: string;
  kind: "grant" | "revoke" | "reschedule";
  targetAddress: string;
  roleKey: string;
  executeAt: string;
  status: "pending" | "ready" | "cancelled";
  note?: string;
}

export interface FunctionRoleRow {
  functionSelector: string;
  functionLabel: string;
  requiredRoles: string[];
}

export interface AuditEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
  detail: string;
  txHash?: string;
}

export interface AccessManagerConfig {
  scope: AccessManagerScope;
  title: string;
  subtitle: string;
  contractAddress: string | null;
  chainId: number;
  members: AMMember[];
  roles: AMRoleDef[];
  hierarchy: HierarchyNode[];
  scheduledOps: ScheduledOp[];
  functionRoleMap: FunctionRoleRow[];
  auditLog: AuditEntry[];
}
