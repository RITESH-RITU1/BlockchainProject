import { describe, it, before } from "node:test";
import assert from "node:assert";
import { network } from "hardhat";

describe("Escrow Smart Contract Automated Tests", async () => {
  let ethers;
  let escrow;
  let deployer;
  let client;
  let freelancer;
  let thirdParty;

  const ONE_DAY = 24 * 60 * 60;
  const SEVEN_DAYS = 7 * ONE_DAY;

  before(async () => {
    const net = await network.create();
    ethers = net.ethers;

    const signers = await ethers.getSigners();
    deployer = signers[0];
    client = signers[1];
    freelancer = signers[2];
    thirdParty = signers[3];

    const EscrowFactory = await ethers.getContractFactory("Escrow");
    escrow = await EscrowFactory.deploy();
    await escrow.waitForDeployment();
  });

  it("1. Should set deployer as arbitrator and start milestoneCounter at 0", async () => {
    const arbitrator = await escrow.arbitrator();
    const counter = await escrow.milestoneCounter();
    assert.strictEqual(arbitrator.toLowerCase(), deployer.address.toLowerCase());
    assert.strictEqual(counter, 0n);
  });

  it("2. Should allow client to create a milestone with deposited ETH", async () => {
    const deposit = ethers.parseEther("0.1");
    const tx = await escrow.connect(client).createMilestone(
      freelancer.address,
      SEVEN_DAYS,
      "Landing Page Milestone",
      { value: deposit }
    );
    await tx.wait();

    const counter = await escrow.milestoneCounter();
    assert.strictEqual(counter, 1n);

    const m = await escrow.milestones(1n);
    assert.strictEqual(m[0].toLowerCase(), client.address.toLowerCase());
    assert.strictEqual(m[1].toLowerCase(), freelancer.address.toLowerCase());
    assert.strictEqual(m[2], deposit);
    assert.strictEqual(Number(m[3]), 1); // State.Locked = 1
    assert.strictEqual(m[5], "Landing Page Milestone");
  });

  it("3. Should reject work submission from unauthorized non-freelancers", async () => {
    await assert.rejects(
      async () => {
        await escrow.connect(thirdParty).submitWork(1n);
      },
      /Only freelancer/
    );
  });

  it("4. Should allow designated freelancer to submit work", async () => {
    const tx = await escrow.connect(freelancer).submitWork(1n);
    await tx.wait();

    const m = await escrow.milestones(1n);
    assert.strictEqual(Number(m[3]), 2); // State.WorkSubmitted = 2
  });

  it("5. Should allow client to release payment, transferring 100% to freelancer", async () => {
    const deposit = ethers.parseEther("0.1");
    const initBalance = await ethers.provider.getBalance(freelancer.address);

    const tx = await escrow.connect(client).releasePayment(1n);
    await tx.wait();

    const postBalance = await ethers.provider.getBalance(freelancer.address);
    assert.strictEqual(postBalance - initBalance, deposit);

    const m = await escrow.milestones(1n);
    assert.strictEqual(Number(m[3]), 4); // State.Completed = 4
  });

  it("6. Should allow client to reject work and arbitrator to resolve dispute", async () => {
    const deposit = ethers.parseEther("0.05");
    // Create milestone #2
    await (await escrow.connect(client).createMilestone(
      freelancer.address,
      SEVEN_DAYS,
      "Second deliverable",
      { value: deposit }
    )).wait();

    // Freelancer submits
    await (await escrow.connect(freelancer).submitWork(2n)).wait();

    // Client rejects work -> Disputed
    await (await escrow.connect(client).rejectWork(2n)).wait();

    let m = await escrow.milestones(2n);
    assert.strictEqual(Number(m[3]), 3); // State.Disputed = 3

    // Non-arbitrator cannot resolve
    await assert.rejects(
      async () => {
        await escrow.connect(thirdParty).resolveDispute(2n, freelancer.address);
      },
      /Only arbitrator/
    );

    // Arbitrator resolves to freelancer
    const initBalance = await ethers.provider.getBalance(freelancer.address);
    await (await escrow.connect(deployer).resolveDispute(2n, freelancer.address)).wait();
    const postBalance = await ethers.provider.getBalance(freelancer.address);

    assert.strictEqual(postBalance - initBalance, deposit);

    m = await escrow.milestones(2n);
    assert.strictEqual(Number(m[3]), 4); // State.Completed = 4
  });
});
