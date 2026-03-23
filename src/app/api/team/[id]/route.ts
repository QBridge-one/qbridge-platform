import { NextResponse } from "next/server";

/**
 * DELETE /api/team/[id]
 *
 * TODO: Integrate your auth provider to remove the member / revoke app access.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing member id" }, { status: 400 });
  }

  // TODO: authProvider.removeMember(id)

  return NextResponse.json({
    ok: true,
    id,
    message: "Member removed (stub — connect auth provider)",
  });
}
