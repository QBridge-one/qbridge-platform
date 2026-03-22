// ============================================================
// lib/access-manager-mock.ts
// Mock configs for AccessManagerPanel — replace with wagmi / API
// ============================================================

import type { AccessManagerConfig } from "@/types/access-manager";
import {
  ALL_PLATFORM_ROLES,
  ALL_TOKEN_ROLES,
  PLATFORM_ROLE_LABELS,
  TOKEN_ROLE_LABELS,
  type PlatformRole,
} from "@/types/roles";
import { MOCK_TEAM } from "@/lib/mock-data";

function shortAddr(a: string) {
  if (a.startsWith("0x") && a.length >= 10) {
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }
  return a;
}

// TODO: wagmi — read PlatformAccessManager address + chain from deployment registry
const PLATFORM_AM_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

// TODO: wagmi — read TokenAccessManager for the active token / asset
const TOKEN_AM_ADDRESS = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as const;

function platformMembersFromMock() {
  return MOCK_TEAM.map((m) => ({
    id: m.id,
    walletAddress: m.walletAddress,
    displayName: m.name,
    email: m.email,
    isActive: m.isActive,
    assignments: [
      ...(m.platformRole
        ? [
            {
              roleKey: m.platformRole,
              roleLabel: PLATFORM_ROLE_LABELS[m.platformRole as PlatformRole],
              grantedAt: m.addedAt,
            },
          ]
        : []),
      ...m.tokenRoles.map((tr) => ({
        roleKey: `${tr.assetSymbol}:${tr.role}`,
        roleLabel: `${TOKEN_ROLE_LABELS[tr.role]} · ${tr.assetSymbol}`,
        grantedAt: tr.grantedAt,
      })),
    ],
  }));
}

function tokenMembersFromMock() {
  return MOCK_TEAM.flatMap((m) =>
    m.tokenRoles.map((tr, i) => ({
      id: `${m.id}-${tr.assetId}-${i}`,
      walletAddress: m.walletAddress,
      displayName: m.name,
      email: m.email,
      isActive: m.isActive,
      assignments: [
        {
          roleKey: tr.role,
          roleLabel: TOKEN_ROLE_LABELS[tr.role],
          grantedAt: tr.grantedAt,
        },
      ],
    }))
  );
}

const platformRoleDefs = ALL_PLATFORM_ROLES.map((r) => ({
  id: r.id.toString(),
  key: r.key,
  label: r.label,
  description: r.description,
  sensitive: r.sensitive,
}));

const tokenRoleDefs = ALL_TOKEN_ROLES.map((r) => ({
  id: r.id.toString(),
  key: r.key,
  label: r.label,
  description: r.description,
  sensitive: r.sensitive,
}));

/** Platform AccessManager — QBridge-operated */
export const PLATFORM_AM_CONFIG: AccessManagerConfig = {
  scope: "platform",
  title: "Platform AccessManager",
  subtitle: "Issuer approval, compliance infra, and emergency controls across QBridge.",
  contractAddress: PLATFORM_AM_ADDRESS,
  chainId: 11155111,
  // TODO: wagmi useReadContract — getRoleMemberCount / members per role
  members: platformMembersFromMock(),
  roles: platformRoleDefs,
  hierarchy: [
    {
      id: "admin",
      parentId: null,
      label: "ADMIN",
      description: "Full platform authority (OZ role id 0)",
    },
    {
      id: "compliance",
      parentId: "admin",
      label: "COMPLIANCE",
      description: "Asset review & compliance checker management",
    },
    {
      id: "operator",
      parentId: "admin",
      label: "OPERATOR",
      description: "KYB, onboarding, day-to-day ops",
    },
    {
      id: "auditor",
      parentId: "admin",
      label: "AUDITOR",
      description: "Read-only platform visibility",
    },
  ],
  scheduledOps: [
    {
      id: "op-1",
      kind: "grant",
      targetAddress: "0x2222222222222222222222222222222222222222",
      roleKey: "OPERATOR",
      executeAt: "2025-03-22T14:00:00Z",
      status: "pending",
      note: "New ops hire — pending multisig",
    },
    {
      id: "op-2",
      kind: "revoke",
      targetAddress: "0x3333333333333333333333333333333333333333",
      roleKey: "COMPLIANCE",
      executeAt: "2025-03-25T09:00:00Z",
      status: "pending",
    },
  ],
  functionRoleMap: [
    {
      functionSelector: "0x…approveIssuer",
      functionLabel: "approveIssuer(address)",
      requiredRoles: ["ADMIN", "COMPLIANCE"],
    },
    {
      functionSelector: "0x…setComplianceChecker",
      functionLabel: "setComplianceChecker(address,address)",
      requiredRoles: ["ADMIN", "COMPLIANCE"],
    },
    {
      functionSelector: "0x…pause",
      functionLabel: "emergencyPause()",
      requiredRoles: ["ADMIN"],
    },
  ],
  auditLog: [
    {
      id: "a-1",
      ts: "2025-02-10T15:02:00Z",
      actor: shortAddr("0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"),
      action: "grantRole",
      detail: "OPERATOR → 0x2222…2222",
      txHash: "0xaaa…001",
    },
    {
      id: "a-2",
      ts: "2025-02-09T11:30:00Z",
      actor: shortAddr("0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"),
      action: "schedule",
      detail: "Delayed revoke COMPLIANCE for rotated wallet",
    },
  ],
};

/** Per-token AccessManager — issuer-controlled */
export const TOKEN_AM_CONFIG: AccessManagerConfig = {
  scope: "token",
  title: "Token AccessManager",
  subtitle: "Mint, compliance actions, pause, and enforcement for the selected token.",
  contractAddress: TOKEN_AM_ADDRESS,
  chainId: 11155111,
  members: tokenMembersFromMock(),
  roles: tokenRoleDefs,
  hierarchy: [
    {
      id: "t-admin",
      parentId: null,
      label: "ADMIN",
      description: "Assigns all token-scoped roles",
    },
    {
      id: "t-minter",
      parentId: "t-admin",
      label: "MINTER",
      description: "Mint within compliance rules",
    },
    {
      id: "t-compliance",
      parentId: "t-admin",
      label: "COMPLIANCE",
      description: "Freeze / partial freeze",
    },
    {
      id: "t-enforcer",
      parentId: "t-admin",
      label: "ENFORCER",
      description: "Force transfer / burn (recovery)",
    },
    {
      id: "t-pauser",
      parentId: "t-admin",
      label: "PAUSER",
      description: "Pause regular token ops",
    },
    {
      id: "t-auditor",
      parentId: "t-admin",
      label: "AUDITOR",
      description: "Read-only token state",
    },
  ],
  scheduledOps: [
    {
      id: "top-1",
      kind: "grant",
      targetAddress: "0x4444444444444444444444444444444444444444",
      roleKey: "MINTER",
      executeAt: "2025-03-21T16:00:00Z",
      status: "ready",
      note: "Treasury rotation",
    },
  ],
  functionRoleMap: [
    {
      functionSelector: "0x…mint",
      functionLabel: "mint(address,uint256)",
      requiredRoles: ["ADMIN", "MINTER"],
    },
    {
      functionSelector: "0x…freeze",
      functionLabel: "setFrozen(address,bool)",
      requiredRoles: ["ADMIN", "COMPLIANCE"],
    },
    {
      functionSelector: "0x…forceTransfer",
      functionLabel: "forceTransfer(from,to,amount)",
      requiredRoles: ["ADMIN", "ENFORCER"],
    },
    {
      functionSelector: "0x…pause",
      functionLabel: "pause() / unpause()",
      requiredRoles: ["ADMIN", "PAUSER"],
    },
  ],
  auditLog: [
    {
      id: "ta-1",
      ts: "2025-02-10T10:00:00Z",
      actor: shortAddr("0xC3D4533949D52ee67447c87F40c8b98092FD1dF1"),
      action: "grantRole",
      detail: "MINTER → treasury multisig",
      txHash: "0xbbb…002",
    },
  ],
};
