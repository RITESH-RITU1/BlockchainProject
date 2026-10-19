export const ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const ESCROW_ABI = [
  "function createMilestone(address _freelancer, uint256 _durationDays, string calldata _description) external payable returns (uint256)",
  "function submitWork(uint256 _milestoneId) external",
  "function releaseFunds(uint256 _milestoneId) external",
  "function claimDefaultPayout(uint256 _milestoneId) external",
  "function getMilestone(uint256 _milestoneId) external view returns (tuple(address client, address freelancer, uint256 amount, uint8 state, uint256 deadline, string description))",
  "function milestoneCounter() external view returns (uint256)",
  "event MilestoneCreated(uint256 indexed milestoneId, address client, address freelancer, uint256 amount, uint256 deadline)"
];
