import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData, getAddress } from "viem";
import type { Chain } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia, mainnet, polygon } from "viem/chains";
import { memoryIntentAdapter } from "@/lib/container";
import type { Address, Hex } from "@/lib/core/types";

const CHAIN_MAP: Record<number, Chain> = {
  11155111: sepolia,
  1: mainnet,
  137: polygon,
};

function parseArgsFromJson(arr: unknown[]): unknown[] {
  return arr.map((arg) => {
    if (typeof arg === "string" && /^\d+$/.test(arg)) return BigInt(arg);
    return arg;
  });
}

function parseRequestValue(v: unknown): bigint | undefined {
  if (v == null || v === "" || v === "0" || v === "0x0") return undefined;
  if (typeof v === "string") {
    if (v.startsWith("0x")) return BigInt(v);
    return BigInt(v);
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, abi, functionName, args: rawArgs = [], chainId, value } = body;

    if (!address || !abi || !functionName || chainId == null) {
      return NextResponse.json(
        { error: "Missing required fields: address, abi, functionName, chainId" },
        { status: 400 },
      );
    }

    const callerRaw = req.headers.get("x-caller-address");
    if (!callerRaw) {
      return NextResponse.json({ error: "Unauthorized: missing x-caller-address" }, { status: 401 });
    }

    let caller: string;
    try {
      caller = getAddress(callerRaw);
    } catch {
      return NextResponse.json({ error: "Invalid caller address" }, { status: 400 });
    }

    const args = parseArgsFromJson(rawArgs as unknown[]);
    const numericChainId = Number(chainId);
    if (!Number.isFinite(numericChainId)) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }

    const chain = CHAIN_MAP[numericChainId];
    if (!chain) {
      return NextResponse.json({ error: `Unsupported chain: ${numericChainId}` }, { status: 400 });
    }

    let calldata: Hex;
    try {
      calldata = encodeFunctionData({
        abi,
        functionName,
        args,
      }) as Hex;
    } catch (err) {
      return NextResponse.json(
        {
          error: `Failed to encode: ${err instanceof Error ? err.message : "unknown"}`,
        },
        { status: 400 },
      );
    }

    let target: string;
    try {
      target = getAddress(address);
    } catch {
      return NextResponse.json({ error: "Invalid contract address" }, { status: 400 });
    }

    const publicClient = createPublicClient({ chain, transport: http() });
    const simValue = parseRequestValue(value);

    try {
      await publicClient.simulateContract({
        address: target as Address,
        abi,
        functionName,
        args,
        account: caller as Address,
        value: simValue,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const intentId = randomUUID();
    const intent = {
      intentId,
      calldata,
      target,
      caller,
      chainId: numericChainId,
      expiresAt: Date.now() + 300_000,
    };

    await memoryIntentAdapter.store(intent);

    const outValue = value != null && value !== "" ? String(value) : "0x0";

    return NextResponse.json({
      intentId,
      unsignedTx: {
        to: target,
        data: calldata,
        chainId: numericChainId,
        value: outValue,
      },
    });
  } catch (err) {
    console.error("[/api/tx/prepare]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
