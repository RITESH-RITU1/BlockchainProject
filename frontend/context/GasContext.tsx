"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { GasFeeDetails, extractGasDetailsFromReceipt } from "@/lib/gas";
import GasDetailsModal from "@/components/GasDetailsModal";
import { Fuel, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export interface PendingTxNotification {
  actionName: string;
  txHash: `0x${string}`;
  status: "pending" | "success" | "reverted";
  gasDetails?: GasFeeDetails;
  error?: string;
}

interface GasContextType {
  trackTransaction: (txHash: `0x${string}`, actionName: string) => Promise<GasFeeDetails | null>;
  openGasModal: (details: GasFeeDetails) => void;
  lastGasDetails: GasFeeDetails | null;
  activeNotification: PendingTxNotification | null;
  dismissNotification: () => void;
}

const GasContext = createContext<GasContextType | null>(null);

export function GasProvider({ children }: { children: React.ReactNode }) {
  const publicClient = usePublicClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGasDetails, setSelectedGasDetails] = useState<GasFeeDetails | null>(null);
  const [lastGasDetails, setLastGasDetails] = useState<GasFeeDetails | null>(null);
  const [activeNotification, setActiveNotification] = useState<PendingTxNotification | null>(null);

  const openGasModal = useCallback((details: GasFeeDetails) => {
    setSelectedGasDetails(details);
    setModalOpen(true);
  }, []);

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const trackTransaction = useCallback(
    async (txHash: `0x${string}`, actionName: string): Promise<GasFeeDetails | null> => {
      // Set initial pending state
      setActiveNotification({
        actionName,
        txHash,
        status: "pending",
      });

      if (!publicClient) {
        console.warn("Public client not ready to track transaction receipt.");
        return null;
      }

      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const details = extractGasDetailsFromReceipt(actionName, receipt);
        setLastGasDetails(details);

        setActiveNotification({
          actionName,
          txHash,
          status: details.status === "success" ? "success" : "reverted",
          gasDetails: details,
        });

        return details;
      } catch (err: any) {
        console.error("Failed to wait for transaction receipt:", err);
        setActiveNotification({
          actionName,
          txHash,
          status: "reverted",
          error: err?.message || "Failed to retrieve transaction receipt",
        });
        return null;
      }
    },
    [publicClient]
  );

  return (
    <GasContext.Provider
      value={{
        trackTransaction,
        openGasModal,
        lastGasDetails,
        activeNotification,
        dismissNotification,
      }}
    >
      {children}

      {/* Global Notification Banner for In-flight and Mined Transactions */}
      {activeNotification && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm w-full bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {activeNotification.status === "pending" && (
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
              )}
              {activeNotification.status === "success" && (
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              )}
              {activeNotification.status === "reverted" && (
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-stone-200">
                  {activeNotification.actionName}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {activeNotification.status === "pending" && "Waiting for confirmation..."}
                  {activeNotification.status === "success" && "Transaction mined successfully!"}
                  {activeNotification.status === "reverted" && (activeNotification.error || "Transaction reverted on-chain.")}
                </p>
              </div>
            </div>

            <button
              onClick={dismissNotification}
              className="text-stone-500 hover:text-stone-300 text-xs px-1"
            >
              ✕
            </button>
          </div>

          {activeNotification.gasDetails && (
            <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-mono">
                {activeNotification.gasDetails.status === "success" ? "Gas Paid" : "Gas Spent"}
              </span>
              <button
                onClick={() => {
                  if (activeNotification.gasDetails) {
                    openGasModal(activeNotification.gasDetails);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
              >
                <Fuel className="h-3.5 w-3.5" />
                View Gas Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gas Details Modal */}
      <GasDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        details={selectedGasDetails}
      />
    </GasContext.Provider>
  );
}

export function useGasTracker() {
  const context = useContext(GasContext);
  if (!context) {
    throw new Error("useGasTracker must be used within a GasProvider");
  }
  return context;
}
