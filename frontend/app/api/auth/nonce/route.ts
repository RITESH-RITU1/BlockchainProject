import { NextResponse } from "next/server";
import { generateNonce, formatAuthMessage } from "@/lib/auth";
import { isAddress } from "viem";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "A valid Ethereum address query parameter is required" },
      { status: 400 }
    );
  }

  const nonce = generateNonce(address);
  const message = formatAuthMessage(address, nonce);

  return NextResponse.json({
    address: address.toLowerCase(),
    nonce,
    message,
  });
}
