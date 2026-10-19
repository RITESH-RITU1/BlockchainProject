"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getEscrowContract } from "@/lib/getEscrowContract";
import { ethers } from "ethers";
import { Plus, Loader2, CheckCircle, AlertCircle, Target, DollarSign, RefreshCw } from "lucide-react";
import { useEscrow } from "@/hooks/useEscrow";

export default function EscrowDetail() {
  const { id } = useParams();
  const escrowId = parseInt(id as string);
  const { escrow, loading, error, refetch } = useEscrow(escrowId);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Additional state for freelancer and client actions
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isReleasingPayment, setIsReleasingPayment] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");

  useEffect(() => {
    // Get user address for role-based actions
    const getUserAddress = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address.toLowerCase());
        }
      } catch (err) {
        console.error("Error getting user address:", err);
      }
    };
    getUserAddress();
  }, []);

  const addStage = async () => {
    if (!desc.trim() || !amount) {
      setStatus("error");
      setErrorMessage("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("idle");
      setErrorMessage("");

      const contract = await getEscrowContract();
      const tx = await contract.addStage(
        escrowId,
        desc,
        ethers.parseEther(amount)
      );
      await tx.wait();

      setStatus("success");
      setDesc("");
      setAmount("");
      // Refresh escrow data
      refetch();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to add stage");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async (stageId: number) => {
    try {
      setIsMarkingComplete(true);
      const contract = await getEscrowContract();
      const tx = await contract.markStageCompleted(escrowId, stageId);
      await tx.wait();
      // Refresh escrow data
      refetch();
    } catch (error) {
      console.error("Error marking stage complete:", error);
      alert("Failed to mark stage as completed");
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleReleasePayment = async (stageId: number) => {
    try {
      setIsReleasingPayment(true);
      const contract = await getEscrowContract();
      const tx = await contract.releaseStagePayment(escrowId, stageId);
      await tx.wait();
      // Refresh escrow data
      refetch();
    } catch (error) {
      console.error("Error releasing payment:", error);
      alert("Failed to release payment");
    } finally {
      setIsReleasingPayment(false);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Active";
      case 1: return "Completed";
      case 2: return "Cancelled";
      default: return "Unknown";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case 1: return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case 2: return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default: return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading escrow details...</p>
        </div>
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 mb-4">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading escrow</p>
            <p className="text-red-500 dark:text-red-300 text-sm">{error || "Escrow not found"}</p>
          </div>
          <button
            onClick={refetch}
            className="btn-primary flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate remaining value (total - sum of paid stages)
  const paidAmount = escrow.stages
    .filter(stage => stage.paid)
    .reduce((sum, stage) => sum + parseFloat(stage.amount), 0);
  const remainingValue = parseFloat(escrow.totalAmount) - paidAmount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Escrow #{id}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage project milestones and payment stages for this escrow contract.
          </p>
        </div>

        {/* Escrow Overview Card */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Escrow Overview</h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(escrow.status)}`}>
              {getStatusText(escrow.status)}
            </span>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Value</p>
              <p className="text-2xl font-bold">{escrow.totalAmount} MNT</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Completed Stages</p>
              <p className="text-2xl font-bold">{escrow.stages.filter(s => s.completed).length}</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Stages</p>
              <p className="text-2xl font-bold">{escrow.stages.length}</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Paid Stages</p>
              <p className="text-2xl font-bold">{escrow.stages.filter(s => s.paid).length}</p>
            </div>
            <div className="text-center">
              <div className="bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Remaining</p>
              <p className="text-2xl font-bold">{remainingValue.toFixed(4)} MNT</p>
            </div>
          </div>
        </div>

        {/* Add Stage Form */}
        <div className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Add New Milestone</h2>
              <p className="text-muted-foreground">Create a payment stage for project deliverables</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Stage Description */}
            <div>
              <label className="label block mb-2">
                Milestone Description
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe what needs to be completed for this milestone..."
                rows={3}
                className="input w-full resize-none"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Clearly describe the deliverables and requirements
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="label block mb-2">
                Payment Amount (MNT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.05"
                step="0.01"
                min="0"
                className="input w-full"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Amount to be released upon milestone completion
              </p>
            </div>

            {/* Status Messages */}
            {status === "success" && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Milestone added successfully!</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Add Stage Button */}
            <button
              onClick={addStage}
              disabled={isLoading}
              className="btn-primary w-full h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Milestone...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Add Milestone
                </>
              )}
            </button>
          </div>
        </div>

        {/* Project Milestones */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Project Milestones</h3>
            {escrow.stages.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No milestones added yet
              </p>
            )}
          </div>

          {escrow.stages.length > 0 ? (
            <div className="space-y-4">
              {escrow.stages.map((stage, index) => (
                <div key={index} className="card p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          stage.paid
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : stage.completed
                            ? 'bg-blue-100 dark:bg-blue-900/20'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          {stage.paid ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : stage.completed ? (
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Target className="h-5 w-5 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Milestone {index + 1}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            {stage.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{stage.amount} MNT</span>
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              stage.paid
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : stage.completed
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }`}>
                              {stage.paid ? 'Paid' : stage.completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex space-x-2">
                      {/* Freelancer: Mark as completed */}
                      {userAddress?.toLowerCase() === escrow.freelancer.toLowerCase() &&
                       !stage.completed && !stage.paid && (
                        <button
                          onClick={() => handleMarkCompleted(index)}
                          disabled={isMarkingComplete}
                          className="btn-secondary text-sm"
                        >
                          {isMarkingComplete ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Mark Complete'
                          )}
                        </button>
                      )}

                      {/* Client: Release payment */}
                      {userAddress?.toLowerCase() === escrow.client.toLowerCase() &&
                       stage.completed && !stage.paid && (
                        <button
                          onClick={() => handleReleasePayment(index)}
                          disabled={isReleasingPayment}
                          className="btn-primary text-sm"
                        >
                          {isReleasingPayment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Release Payment'
                          )}
                        </button>
                      )}

                      {/* Show status messages */}
                      {stage.completed && !stage.paid && userAddress?.toLowerCase() === escrow.client.toLowerCase() && (
                        <span className="text-sm text-orange-600 dark:text-orange-400">
                          Awaiting payment release
                        </span>
                      )}

                      {stage.completed && !stage.paid && userAddress?.toLowerCase() === escrow.freelancer.toLowerCase() && (
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          Awaiting client approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Target className="h-12 w-12 text-gray-600 dark:text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                No milestones added yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add milestones to break down your project into manageable deliverables.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
