import { NextRequest, NextResponse } from "next/server";
import { getAddress, parseTransaction } from "viem";
import { memoryIntentAdapter, viemBroadcastAdapter } from "@/lib/container";
import type { Hex } from "@/lib/core/types";

function normalizeHex(h: string | undefined): string | null {
  if (!h) return null;
  const x = h.toLowerCase();
  return x.startsWith("0x") ? x : `0x${x}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intentId, signedTx } = body;

    if (!intentId || !signedTx) {
      return NextResponse.json(
        { error: "Missing required fields: intentId, signedTx" },
        { status: 400 },
      );
    }

    const intent = await memoryIntentAdapter.consume(intentId);
    if (!intent) {
      return NextResponse.json({ error: "Intent not found or expired" }, { status: 404 });
    }

    let parsed;
    try {
      parsed = parseTransaction(signedTx as Hex);
    } catch {
      return NextResponse.json({ error: "Invalid signed transaction" }, { status: 400 });
    }

    const decodedTo = parsed.to ? getAddress(parsed.to) : null;
    const decodedData = normalizeHex(parsed.data as string | undefined);
    const expectedTarget = getAddress(intent.target);
    const expectedData = normalizeHex(intent.calldata);

    if (!decodedTo || decodedTo !== expectedTarget) {
      return NextResponse.json({ error: "Transaction target does not match intent" }, { status: 403 });
    }

    if (!decodedData || !expectedData || decodedData !== expectedData) {
      return NextResponse.json({ error: "Transaction calldata does not match intent" }, { status: 403 });
    }

    const hash = await viemBroadcastAdapter.sendRawTransaction(String(signedTx), intent.chainId);

    return NextResponse.json({ hash });
  } catch (err) {
    console.error("[/api/tx/broadcast]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
