// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    enum State { Uninitialized, Locked, WorkSubmitted, Disputed, Completed }

    struct Milestone {
        address client;
        address freelancer;
        uint256 amount;
        State state;
        uint256 deadline;
        string description;
    }

    mapping(uint256 => Milestone) public milestones;
    uint256 public milestoneCounter;
    address public arbitrator;

    event MilestoneCreated(uint256 indexed milestoneId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline);
    event WorkSubmitted(uint256 indexed milestoneId);
    event PaymentReleased(uint256 indexed milestoneId, address indexed freelancer, uint256 amount);
    event DisputeRaised(uint256 indexed milestoneId);
    event DisputeResolved(uint256 indexed milestoneId, address winner, uint256 amount);

    modifier onlyClient(uint256 _milestoneId) {
        require(msg.sender == milestones[_milestoneId].client, "Only client");
        _;
    }

    modifier onlyFreelancer(uint256 _milestoneId) {
        require(msg.sender == milestones[_milestoneId].freelancer, "Only freelancer");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator");
        _;
    }

    constructor() {
        // For this demo, the deployer acts as the 3rd-party multi-sig arbitrator
        arbitrator = msg.sender;
    }

    function createMilestone(address _freelancer, uint256 _durationSeconds, string calldata _description) external payable returns (uint256) {
        require(msg.value > 0, "Deposit required");
        
        milestoneCounter++;
        uint256 newId = milestoneCounter;

        Milestone storage m = milestones[newId];
        m.client = msg.sender;
        m.freelancer = _freelancer;
        m.amount = msg.value;
        m.state = State.Locked;
        m.deadline = block.timestamp + _durationSeconds;
        m.description = _description;

        emit MilestoneCreated(newId, msg.sender, _freelancer, msg.value, m.deadline);
        return newId;
    }

    function submitWork(uint256 _milestoneId) external onlyFreelancer(_milestoneId) {
        Milestone storage m = milestones[_milestoneId];
        require(m.state == State.Locked, "Invalid state");
        
        m.state = State.WorkSubmitted;
        emit WorkSubmitted(_milestoneId);
    }

    function releasePayment(uint256 _milestoneId) external onlyClient(_milestoneId) {
        Milestone storage m = milestones[_milestoneId];
        require(m.state == State.WorkSubmitted, "Work not submitted");
        
        m.state = State.Completed;
        
        // 100% transfer, 0% platform fee
        (bool success, ) = m.freelancer.call{value: m.amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(_milestoneId, m.freelancer, m.amount);
    }

    // NEW: Client rejects work
    function rejectWork(uint256 _milestoneId) external onlyClient(_milestoneId) {
        Milestone storage m = milestones[_milestoneId];
        require(m.state == State.WorkSubmitted, "Work not submitted");
        
        m.state = State.Disputed;
        emit DisputeRaised(_milestoneId);
    }

    // NEW: Arbitrator resolves the dispute (multi-sig simulation)
    function resolveDispute(uint256 _milestoneId, address _winner) external onlyArbitrator {
        Milestone storage m = milestones[_milestoneId];
        require(m.state == State.Disputed, "Not in dispute");
        require(_winner == m.client || _winner == m.freelancer, "Invalid winner");

        m.state = State.Completed;

        (bool success, ) = _winner.call{value: m.amount}("");
        require(success, "Transfer failed");

        emit DisputeResolved(_milestoneId, _winner, m.amount);
    }

    function claimDefaultPayout(uint256 _milestoneId) external onlyFreelancer(_milestoneId) {
        Milestone storage m = milestones[_milestoneId];
        require(m.state == State.WorkSubmitted, "Work not submitted");
        require(block.timestamp > m.deadline, "Deadline not passed");

        m.state = State.Completed;

        // Auto-release 100% to freelancer
        (bool success, ) = m.freelancer.call{value: m.amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(_milestoneId, m.freelancer, m.amount);
    }
}
