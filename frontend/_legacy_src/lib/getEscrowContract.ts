import { ethers } from "ethers";
import { ESCROW_ABI, ESCROW_ADDRESS } from "@/config/contract";

export async function getEscrowContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  return new ethers.Contract(
    ESCROW_ADDRESS,
    ESCROW_ABI,
    signer
  );
}
