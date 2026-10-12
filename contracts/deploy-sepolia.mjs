import { JsonRpcProvider, Wallet, ContractFactory, formatEther } from "ethers";
import { compileContract } from "./compile.mjs";

const needed = (name, max) => {
  const input = process.env[name] || "";
  if (!input.trim() || input.length > max) throw new Error("Provide a valid " + name + ".");
  return input.trim();
};
const name = needed("TOKEN_NAME", 80);
const symbol = needed("TOKEN_SYMBOL", 12).toUpperCase();
const supply = needed("TOKEN_SUPPLY", 30);
const decimals = Number(process.env.TOKEN_DECIMALS || 18);
if (!/^[A-Z][A-Z0-9]{1,11}$/.test(symbol)) throw new Error("Invalid token symbol.");
if (!/^[1-9][0-9]{0,29}$/.test(supply)) throw new Error("Invalid whole-token supply.");
if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("Invalid token decimals.");
const rpc = needed("SEPOLIA_RPC_URL", 500);
const signingKey = needed("SEPOLIA_DEPLOYER_PRIVATE_KEY", 66);
if (!/^https:\/\//.test(rpc) || !/^0x[a-fA-F0-9]{64}$/.test(signingKey))
  throw new Error("Use HTTPS Sepolia RPC and a dedicated locally held funded TESTNET key.");
const provider = new JsonRpcProvider(rpc);
const network = await provider.getNetwork();
if (network.chainId !== 11155111n) throw new Error("Refusing to deploy outside Ethereum Sepolia (11155111).");
const signer = new Wallet(signingKey, provider);
const artifact = compileContract();
const balance = await provider.getBalance(signer.address);
if (balance === 0n) throw new Error("Deployer needs Sepolia TEST ETH for gas.");
console.log("Sepolia deployer:", signer.address, "| test ETH:", formatEther(balance));
console.log("Token:", symbol, "| whole-token supply:", supply, "| decimals:", decimals);
const token = await new ContractFactory(artifact.abi, artifact.bytecode, signer)
  .deploy(name, symbol, decimals, BigInt(supply));
const transaction = token.deploymentTransaction();
console.log("Submitted testnet transaction:", transaction.hash);
const receipt = await transaction.wait(1);
if (!receipt || receipt.status !== 1) throw new Error("Deployment not confirmed successful.");
const address = await token.getAddress();
const [observedSupply, holderBalance] = await Promise.all([
  token.totalSupply(), token.balanceOf(signer.address)
]);
if (observedSupply !== BigInt(supply) * 10n ** BigInt(decimals) || observedSupply !== holderBalance)
  throw new Error("Deployed token supply was not verified against creator balance.");
console.log(JSON.stringify({
  network: "ethereum-sepolia", chainId: 11155111, address, transactionHash: receipt.hash,
  tokenSymbol: symbol, initialWholeSupply: supply, decimals,
  holder: signer.address, chainVerified: true, externalAudit: false,
  productionOrInvestmentReady: false
}, null, 2));
