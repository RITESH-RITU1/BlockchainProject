import { formatEther } from "viem";

export interface GasFeeDetails {
  actionName: string;
  txHash: `0x${string}`;
  status: "success" | "reverted";
  gasUsed: bigint;
  effectiveGasPrice?: bigint;
  executionFeeWei: bigint;
  l1FeeWei?: bigint;
  totalFeeWei: bigint;
  l1GasUsed?: bigint;
  l1GasPrice?: bigint;
  isPartialFee?: boolean;
}

export interface GasSavingsComparison {
  actualFeeEth: string;
  actualFeeUsd?: number;
  ethL1BenchmarkFeeEth: string;
  ethL1BenchmarkFeeUsd: number;
  estimatedSavingsEth: string;
  savingsPercentage: number;
}

/**
 * Format an ETH amount keeping full precision for tiny values,
 * stripping unnecessary trailing zeros while ensuring at least 4-8 decimals for clarity.
 */
export function formatEthFee(wei: bigint): string {
  const formatted = formatEther(wei);
  // If formatted has a decimal point, avoid scientific notation or over-truncation
  if (!formatted.includes(".")) return formatted;

  // Split into integer and fractional parts
  const [intPart, fracPart] = formatted.split(".");
  // Strip trailing zeros, but keep at least 4 digits if non-zero
  let trimmedFrac = fracPart.replace(/0+$/, "");
  if (trimmedFrac.length < 4) {
    trimmedFrac = fracPart.slice(0, 4);
  }
  return `${intPart}.${trimmedFrac}`;
}

/**
 * Check if the total fee in Wei is strictly below 0.00001 ETH
 * 0.00001 ETH = 10^13 Wei = 10,000,000,000,000 Wei
 */
export const LOW_GAS_FEE_THRESHOLD_WEI = 10_000_000_000_000n; // 0.00001 ETH

export function isLowGasFee(totalFeeWei: bigint): boolean {
  return totalFeeWei < LOW_GAS_FEE_THRESHOLD_WEI;
}

/**
 * Benchmark constants matching the existing Gas Comparison page:
 * - Ethereum L1 contract call benchmark: ~$22.00 (approx 0.0073 ETH at $3000/ETH or standard 21k-100k gas at 20-30 gwei)
 * In the project's Gas Comparison page, contract call on Ethereum L1 is listed as $22.00 vs Arbitrum Sepolia ~$0.03.
 * Assuming ~0.0073 ETH benchmark for Ethereum L1 contract execution:
 */
export const ETH_L1_BENCHMARK_ETH = 0.0073; // ~$22 at ~$3,000/ETH
export const ETH_USD_PRICE_ESTIMATE = 3000;

export function calculateGasSavings(totalFeeWei: bigint): GasSavingsComparison {
  const actualEthStr = formatEther(totalFeeWei);
  const actualEthNum = parseFloat(actualEthStr);

  const referenceFeeEth = ETH_L1_BENCHMARK_ETH;
  const estimatedSavingsEthNum = Math.max(0, referenceFeeEth - actualEthNum);
  const savingsPercentage = referenceFeeEth > 0
    ? (estimatedSavingsEthNum / referenceFeeEth) * 100
    : 0;

  return {
    actualFeeEth: formatEthFee(totalFeeWei),
    actualFeeUsd: Number((actualEthNum * ETH_USD_PRICE_ESTIMATE).toFixed(4)),
    ethL1BenchmarkFeeEth: referenceFeeEth.toString(),
    ethL1BenchmarkFeeUsd: 22.0,
    estimatedSavingsEth: estimatedSavingsEthNum.toFixed(6),
    savingsPercentage: Number(savingsPercentage.toFixed(2)),
  };
}

/**
 * Parse an on-chain transaction receipt into typed gas fee details.
 * Inspects Arbitrum receipt fields (l1Fee, gasUsedForL1, etc.) if present.
 */
export function extractGasDetailsFromReceipt(
  actionName: string,
  receipt: any
): GasFeeDetails {
  const txHash = receipt.transactionHash as `0x${string}`;
  const status = receipt.status === "success" || receipt.status === 1 ? "success" : "reverted";

  const gasUsed = BigInt(receipt.gasUsed ?? 0);
  const effectiveGasPrice = receipt.effectiveGasPrice !== undefined && receipt.effectiveGasPrice !== null
    ? BigInt(receipt.effectiveGasPrice)
    : undefined;

  // Execution fee = gasUsed * effectiveGasPrice (if available)
  const executionFeeWei = effectiveGasPrice !== undefined
    ? gasUsed * effectiveGasPrice
    : 0n;

  // Check for Arbitrum Layer 1 fee fields on receipt if exposed:
  // Viem/Nitro sometimes exposes l1Fee or gasUsedForL1
  let l1FeeWei: bigint | undefined = undefined;
  if (receipt.l1Fee !== undefined && receipt.l1Fee !== null) {
    l1FeeWei = BigInt(receipt.l1Fee);
  }

  let l1GasUsed: bigint | undefined = undefined;
  if (receipt.gasUsedForL1 !== undefined && receipt.gasUsedForL1 !== null) {
    l1GasUsed = BigInt(receipt.gasUsedForL1);
  }

  let l1GasPrice: bigint | undefined = undefined;
  if (receipt.l1GasPrice !== undefined && receipt.l1GasPrice !== null) {
    l1GasPrice = BigInt(receipt.l1GasPrice);
  }

  // Total actual transaction fee in Wei
  const totalFeeWei = executionFeeWei + (l1FeeWei ?? 0n);
  const isPartialFee = effectiveGasPrice === undefined;

  return {
    actionName,
    txHash,
    status,
    gasUsed,
    effectiveGasPrice,
    executionFeeWei,
    l1FeeWei,
    totalFeeWei,
    l1GasUsed,
    l1GasPrice,
    isPartialFee,
  };
}
