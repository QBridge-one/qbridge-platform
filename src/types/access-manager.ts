// ============================================================
// types/access-manager.ts
// Minimal role definition shared by the ABI engine and contract
// form components.
// ============================================================

export interface RoleDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  sensitive?: boolean;
}
