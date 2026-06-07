// ============================================================
// lib/contracts/issuer-registry-status.ts
// Server-side batch reads of IssuerRegistry.getStatus for ops lists.
// Reads the full status enum (not just isApproved) so the ops queue can
// distinguish Suspended / Revoked from never-registered.
// ============================================================

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import type { Address } from "../core/types";
import type { OrganizationPort } from "../ports/organization.port";
import { getIssuerRegistryAddress } from "./registry";
import { findIssuerAdminMember } from "./issuer-registry-payload";
import { ISSUER_REGISTRY_ABI } from "../generated/issuer-registry/abi";

const OPS_REGISTRY_CHAIN_ID = 11155111;

export type IssuerRegistryRowStatus =
  | "approved"
  | "suspended"
  | "revoked"
  | "not_registered"
  | "no_wallet"
  | "no_admin"
  | "unconfigured";

/** Map the on-chain IssuerStatus enum (0 None, 1 Active, 2 Suspended,
 *  3 Revoked) to a row status. None / anything unknown = never registered. */
function mapIssuerStatus(status: number): IssuerRegistryRowStatus {
  switch (status) {
    case 1:
      return "approved";
    case 2:
      return "suspended";
    case 3:
      return "revoked";
    default:
      return "not_registered";
  }
}

export interface IssuerRegistryStatusEntry {
  wallet: Address | null;
  status: IssuerRegistryRowStatus;
}

export type IssuerRegistryStatusMap = Record<string, IssuerRegistryStatusEntry>;

export async function batchIssuerRegistryStatus(
  organization: OrganizationPort,
  orgIds: readonly string[],
): Promise<IssuerRegistryStatusMap> {
  const registryAddress = getIssuerRegistryAddress(OPS_REGISTRY_CHAIN_ID);
  const trimmed = registryAddress?.trim() ?? "";
  const unconfigured: IssuerRegistryStatusEntry = {
    wallet: null,
    status: "unconfigured",
  };

  if (!trimmed) {
    return Object.fromEntries(orgIds.map((id) => [id, unconfigured]));
  }

  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const entries = await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        const org = await organization.getOrg(orgId);
        if (!org || org.kind !== "issuer") {
          return [orgId, { wallet: null, status: "no_admin" as const }] satisfies [
            string,
            IssuerRegistryStatusEntry,
          ];
        }

        const members = await organization.listMembers(orgId);
        const admin = findIssuerAdminMember(members);
        if (!admin) {
          return [orgId, { wallet: null, status: "no_admin" as const }] satisfies [
            string,
            IssuerRegistryStatusEntry,
          ];
        }
        if (!admin.walletAddress) {
          return [orgId, { wallet: null, status: "no_wallet" as const }] satisfies [
            string,
            IssuerRegistryStatusEntry,
          ];
        }

        const statusRaw = await client.readContract({
          address: trimmed as Address,
          abi: ISSUER_REGISTRY_ABI,
          functionName: "getStatus",
          args: [admin.walletAddress],
        });

        return [
          orgId,
          {
            wallet: admin.walletAddress,
            status: mapIssuerStatus(Number(statusRaw)),
          },
        ] satisfies [string, IssuerRegistryStatusEntry];
      } catch {
        return [orgId, unconfigured] satisfies [string, IssuerRegistryStatusEntry];
      }
    }),
  );

  return Object.fromEntries(entries);
}
