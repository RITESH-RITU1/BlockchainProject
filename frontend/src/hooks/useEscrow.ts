"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getEscrowContract } from "@/lib/getEscrowContract";

export interface StageDetails {
  description: string;
  amount: string;
  completed: boolean;
  paid: boolean;
}

export interface EscrowDetails {
  id: number;
  client: string;
  freelancer: string;
  totalAmount: string;
  status: number; // 0 = Active, 1 = Completed, 2 = Cancelled
  stages: StageDetails[];
}

export function useEscrow(escrowId: number) {
  const [escrow, setEscrow] = useState<EscrowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getEscrowContract();
      const escrowData = await contract.escrows(escrowId);
      const stages = await contract.getEscrowStages(escrowId);

      // Format stages data
      const formattedStages: StageDetails[] = stages.map((stage: any) => ({
        description: stage.description || '',
        amount: ethers.formatEther(stage.amount || '0'),
        completed: Boolean(stage.completed),
        paid: Boolean(stage.paid)
      }));

      setEscrow({
        id: escrowId,
        client: escrowData.client,
        freelancer: escrowData.freelancer,
        totalAmount: ethers.formatEther(escrowData.totalAmount),
        status: escrowData.status,
        stages: formattedStages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch escrow");
      console.error("Error fetching escrow:", err);
    } finally {
      setLoading(false);
    }
  }, [escrowId]);

  useEffect(() => {
    if (escrowId) {
      fetchEscrow();
    }
  }, [escrowId, fetchEscrow]);

  return { escrow, loading, error, refetch: fetchEscrow };
}
