import { parseAbi } from 'viem'

// Deployed to Arbitrum Sepolia
export const ESCROW_CONTRACT_ADDRESS = "0xAbc85afeC52cf3C8371e54dB11Fe28129DE9F824"

export const ESCROW_ABI = parseAbi([
  "function milestoneCounter() view returns (uint256)",
  "function arbitrator() view returns (address)",
  "function milestones(uint256) view returns (address client, address freelancer, uint256 amount, uint8 state, uint256 deadline, string description)",
  "function createMilestone(address _freelancer, uint256 _durationSeconds, string calldata _description) payable returns (uint256)",
  "function submitWork(uint256 _milestoneId)",
  "function releasePayment(uint256 _milestoneId)",
  "function rejectWork(uint256 _milestoneId)",
  "function resolveDispute(uint256 _milestoneId, address _winner)",
  "function claimDefaultPayout(uint256 _milestoneId)",
  "event MilestoneCreated(uint256 indexed milestoneId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline)",
  "event WorkSubmitted(uint256 indexed milestoneId)",
  "event PaymentReleased(uint256 indexed milestoneId, address indexed freelancer, uint256 amount)",
  "event DisputeRaised(uint256 indexed milestoneId)",
  "event DisputeResolved(uint256 indexed milestoneId, address winner, uint256 amount)"
])
