"use client";

import { useState } from "react";
import { getEscrowContract } from "@/lib/getEscrowContract";
import { ethers } from "ethers";
import { Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function EscrowPage() {
  const [freelancer, setFreelancer] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const createEscrow = async () => {
    if (!freelancer || !amount) {
      setStatus("error");
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (!ethers.isAddress(freelancer)) {
      setStatus("error");
      setErrorMessage("Please enter a valid Ethereum address");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("idle");
      setErrorMessage("");

      const contract = await getEscrowContract();
      const tx = await contract.createEscrow(freelancer, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();

      setStatus("success");
      setFreelancer("");
      setAmount("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to create escrow");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Create New Escrow
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Set up a secure escrow contract for your freelance project. Funds will be held safely until work is completed and approved.
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8 max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* Freelancer Address */}
            <div>
              <label className="label block mb-2">
                Freelancer Address
              </label>
              <input
                type="text"
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value)}
                placeholder="0x..."
                className="input w-full"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Enter the Ethereum address of the freelancer
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="label block mb-2">
                Escrow Amount (MNT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                step="0.01"
                min="0"
                className="input w-full"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Total amount to be held in escrow
              </p>
            </div>

            {/* Status Messages */}
            {status === "success" && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Escrow created successfully!</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={createEscrow}
              disabled={isLoading}
              className="btn-primary w-full h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Escrow...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Create Escrow
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">How it works:</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <p>You deposit funds into the smart contract escrow</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <p>Freelancer completes work and requests payment for milestones</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <p>You approve completed work to release funds automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
