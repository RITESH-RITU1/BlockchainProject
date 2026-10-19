import { NextResponse } from "next/server";
import { verifyWalletSignature, createSessionToken } from "@/lib/auth";
import { isAddress } from "viem";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, signature, nonce } = body;

    if (!address || !isAddress(address) || !signature || !nonce) {
      return NextResponse.json(
        { error: "Address, signature, and nonce are required" },
        { status: 400 }
      );
    }

    const isValid = await verifyWalletSignature(address, signature, nonce);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature or expired challenge nonce" },
        { status: 401 }
      );
    }

    const token = createSessionToken(address);
    return NextResponse.json({
      success: true,
      token,
      address: address.toLowerCase(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
