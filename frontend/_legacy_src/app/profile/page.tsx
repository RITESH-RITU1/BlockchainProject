"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, Briefcase, DollarSign, Clock, ArrowRight, Plus, Loader2, Target } from "lucide-react";
import { useUserEscrows } from "@/hooks/useUserEscrows";
import { ethers } from "ethers";

export default function Profile() {
  const { escrows, loading, error, refetch } = useUserEscrows();
  const [userAddress, setUserAddress] = useState<string>("");

  useEffect(() => {
    // Get user address for filtering
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

  // Separate escrows by role
  const clientEscrows = escrows.filter(escrow =>
    escrow.client.toLowerCase() === userAddress
  );

  const freelancerEscrows = escrows.filter(escrow =>
    escrow.freelancer.toLowerCase() === userAddress
  );

  // Calculate totals
  const totalValue = escrows.reduce((sum, escrow) => sum + parseFloat(escrow.totalAmount), 0);
  const activeEscrows = escrows.filter(escrow => escrow.status === 0).length; // 0 = Active

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
          <p className="text-gray-600 dark:text-gray-300">Loading your escrows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 mb-4">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading escrows</p>
            <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your escrow contracts and track project progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Value</p>
                <p className="text-2xl font-bold">{totalValue} MNT</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Active Escrows</p>
                <p className="text-2xl font-bold">{activeEscrows}</p>
              </div>
            </div>
          </div>

          {/* <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Pending Payments</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mb-12">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/escrow"
              className="btn-primary flex items-center justify-center flex-1"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Escrow
            </Link>
            <button className="btn-secondary flex items-center justify-center flex-1">
              View All Transactions
            </button>
          </div>
        </div>

        {/* Client Escrows */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">As Client</h2>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {clientEscrows.length} escrows
            </span>
          </div>

          {clientEscrows.length > 0 ? (
            <div className="grid gap-6">
              {clientEscrows.map((escrow) => (
                <div key={escrow.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">Escrow #{escrow.id}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(escrow.status)}`}>
                          {getStatusText(escrow.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Freelancer: {escrow.freelancer.slice(0, 6)}...{escrow.freelancer.slice(-4)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1">
                          {/* <DollarSign className="h-4 w-4" /> */}
                          <span>{escrow.totalAmount} MNT</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>{escrow.stages?.length || 0} stages</span>
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Link
                        href={`/escrow/${escrow.id}`}
                        className="btn-secondary inline-flex items-center"
                      >
                        Manage
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-600 dark:text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">No client escrows yet</p>
              <Link href="/escrow" className="btn-primary">
                Create Your First Escrow
              </Link>
            </div>
          )}
        </div>

        {/* Freelancer Escrows */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">As Freelancer</h2>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {freelancerEscrows.length} escrows
            </span>
          </div>

          {freelancerEscrows.length > 0 ? (
            <div className="grid gap-6">
              {freelancerEscrows.map((escrow) => (
                <div key={escrow.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">Escrow #{escrow.id}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(escrow.status)}`}>
                          {getStatusText(escrow.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Client: {escrow.client.slice(0, 6)}...{escrow.client.slice(-4)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{escrow.totalAmount} MNT</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>{escrow.stages?.length || 0} stages</span>
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Link
                        href={`/escrow/${escrow.id}`}
                        className="btn-secondary inline-flex items-center"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <User className="h-12 w-12 text-gray-600 dark:text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">No freelancer escrows yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Escrows will appear here when clients hire you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
