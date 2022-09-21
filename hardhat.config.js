require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    miRed: {
      url: "http://localhost:8545",
      accounts: ["4d621aeb8f83a2ec3e217ff567120f820aeaed6e7b4dff86744c45e3b66c177a"], //0xDfb8Cbbd46d5A13cfD74AB8863ebbC317d417523
      gas: 2100000,
      gasPrice: 8000000000
    }
  }
};
