async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const GreenToken = await ethers.getContractFactory("GreenToken");
  const gtoken = await upgrades.deployProxy(GreenToken, ["GreenToken", "GRT"]);

  console.log("Token address:", gtoken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });