import {
  type IssuerKybApplication,
  type IssuerKybStatus,
  issuerKybApplicationFromMetadata,
  parseIssuerKybStatusField,
} from "../../core/issuer-kyb";

/** Derive issuer KYB fields from Clerk org publicMetadata */
export function kybFieldsFromOrganizationPublicMeta(
  kind: "ops" | "issuer",
  publicMetadata: unknown,
): {
  kybStatus: IssuerKybStatus | null;
  kybApplication: IssuerKybApplication | null;
} {
  if (kind === "ops") {
    return { kybStatus: null, kybApplication: null };
  }
  const kybStatus = parseIssuerKybStatusField(
    publicMetadata &&
      typeof publicMetadata === "object" &&
      "kybStatus" in publicMetadata &&
      typeof (publicMetadata as { kybStatus?: unknown }).kybStatus === "string"
      ? (publicMetadata as { kybStatus?: unknown }).kybStatus
      : undefined,
  );
  const kybApplication = issuerKybApplicationFromMetadata(publicMetadata);
  return { kybStatus, kybApplication };
}
