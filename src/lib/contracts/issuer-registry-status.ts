// ============================================================
// lib/contracts/issuer-registry-status.ts
// Server-side batch reads of IssuerRegistry.isApproved for ops lists.
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
  | "not_registered"
  | "no_wallet"
  | "no_admin"
  | "unconfigured";

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

        const isApproved = await client.readContract({
          address: trimmed as Address,
          abi: ISSUER_REGISTRY_ABI,
          functionName: "isApproved",
          args: [admin.walletAddress],
        });

        return [
          orgId,
          {
            wallet: admin.walletAddress,
            status: isApproved ? ("approved" as const) : ("not_registered" as const),
          },
        ] satisfies [string, IssuerRegistryStatusEntry];
      } catch {
        return [orgId, unconfigured] satisfies [string, IssuerRegistryStatusEntry];
      }
    }),
  );

  return Object.fromEntries(entries);
}
