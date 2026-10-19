"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getEscrowContract } from "@/lib/getEscrowContract";

export interface StageData {
  description: string;
  amount: string;
  completed: boolean;
  paid: boolean;
}

export interface EscrowData {
  id: number;
  client: string;
  freelancer: string;
  totalAmount: string;
  status: number; // 0 = Active, 1 = Completed, 2 = Cancelled
  stages: StageData[];
}

export function useUserEscrows() {
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserEscrows();
  }, []);

  const fetchUserEscrows = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const contract = await getEscrowContract();
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get total number of escrows
      const escrowCounter = await contract.escrowCounter();
      const totalEscrows = Number(escrowCounter);

      const userEscrows: EscrowData[] = [];

      // Fetch all escrows and filter by user involvement
      for (let i = 1; i <= totalEscrows; i++) {
        try {
          const escrow = await contract.escrows(i);

          // Check if user is client or freelancer
          if (escrow.client.toLowerCase() === userAddress.toLowerCase() ||
              escrow.freelancer.toLowerCase() === userAddress.toLowerCase()) {

            // Fetch stages for this escrow
            const stages = await contract.getEscrowStages(i);
            const formattedStages: StageData[] = stages.map((stage: any) => ({
              description: stage.description || '',
              amount: ethers.formatEther(stage.amount || '0'),
              completed: Boolean(stage.completed),
              paid: Boolean(stage.paid)
            }));

            userEscrows.push({
              id: i,
              client: escrow.client,
              freelancer: escrow.freelancer,
              totalAmount: ethers.formatEther(escrow.totalAmount),
              status: escrow.status,
              stages: formattedStages
            });
          }
        } catch (err) {
          // Skip escrows that don't exist or have errors
          console.warn(`Error fetching escrow ${i}:`, err);
        }
      }

      setEscrows(userEscrows);
    } catch (err: any) {
      setError(err.message || "Failed to fetch escrows");
      console.error("Error fetching user escrows:", err);
    } finally {
      setLoading(false);
    }
  };

  return { escrows, loading, error, refetch: fetchUserEscrows };
}
