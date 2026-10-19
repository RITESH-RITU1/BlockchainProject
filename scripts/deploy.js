import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();

  const escrow = await ethers.deployContract("Escrow");
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`Escrow contract deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
