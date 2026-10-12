// Noncustodial EVM testnet issuance: users approve each transaction in their own wallet.
// Mainnet and securities/investor issuance are intentionally not enabled.
import { normalizeLaunchpad } from "./offerings.mjs";
const safe = (x) => String(x ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const address = (value) => /^0x[a-fA-F0-9]{40}$/.test(value || "");
const transaction = (value) => /^0x[a-fA-F0-9]{64}$/.test(value || "");
const selectorBalance = "0x70a08231";

export function encodeTokenConstructor(token) {
  if (!token || !/^[1-9][0-9]{0,29}$/.test(token.supply || "") ||
      !Number.isInteger(token.decimals) || token.decimals < 0 || token.decimals > 18 ||
      typeof token.name !== "string" || !token.name.trim() ||
      typeof token.symbol !== "string" || !/^[A-Z][A-Z0-9]{1,11}$/.test(token.symbol)) {
    throw new Error("Valid saved blueprint required.");
  }
  const word = (x) => BigInt(x).toString(16).padStart(64, "0");
  const tail = (s) => {
    const bytes = new TextEncoder().encode(s);
    const hex = Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
    return word(bytes.length) + hex.padEnd(Math.ceil(hex.length / 64) * 64, "0");
  };
  const first = tail(token.name), second = tail(token.symbol);
  return word(128) + word(128 + first.length / 2) +
    word(token.decimals) + word(token.supply) + first + second;
}
export function renderTokenDeployment(state) {
  const tokens = normalizeLaunchpad(state.launchpad).tokens.filter((t) => t.chain === "ethereum");
  const records = Array.isArray(state.testnetDeployments) ? state.testnetDeployments.slice(-10) : [];
  const list = records.map((entry) =>
    address(entry.contractAddress) && transaction(entry.txHash)
      ? '<article class="item"><span class="pill">unverified browser record · Sepolia</span>' +
        '<p><strong>Contract:</strong> <code>' + safe(entry.contractAddress) + '</code></p>' +
        '<a href="https://sepolia.etherscan.io/tx/' + safe(entry.txHash) + '" rel="noopener noreferrer" target="_blank">Open deployment transaction in explorer</a></article>'
      : "").join("");
  return '<section class="card"><h2>4 · Mint cryptocurrency on Ethereum Sepolia testnet</h2>' +
    '<p>Deploy a real fixed-supply ERC-20 smart contract and mint the initial supply to your wallet, using Ethereum Sepolia TEST ETH for gas. This is a testnet only. No paid investment or mainnet token launch; contract is NOT independently audited.</p>' +
    '<div class="notice danger">Wallet controls private keys. Never enter or upload a seed phrase or private key here. Transactions are irreversible; gas is spent on the test network. Select an Ethereum network blueprint below.</div>' +
    '<form id="sepolia-token-deploy" class="launchpad-form">' +
    '<label>Token to deploy<select name="tokenId" required><option value="">Select saved Ethereum blueprint</option>' +
    tokens.map((t) => '<option value="' + safe(t.id) + '">' + safe(t.symbol + " · " + t.name) + "</option>").join("") +
    '</select></label><button class="btn primary" type="submit">Deploy TESTNET token with wallet approval</button>' +
    '<p id="sepolia-deploy-status" role="status"></p></form>' +
    '<h3>Testnet receipts saved in this browser</h3>' +
    (list || '<div class="empty">No saved transaction records. A browser record is not proof; verify in a block explorer.</div>') +
    '</section>';
}

export function bindTokenDeployment({ state, save, render }) {
  const form = document.getElementById("sepolia-token-deploy");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("sepolia-deploy-status");
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const report = (text, error = false) => {
      if (status?.isConnected) {
        status.textContent = text;
        status.className = error ? "bad" : "good";
      }
    };
    try {
      const chosen = new FormData(form).get("tokenId");
      const token = normalizeLaunchpad(state.launchpad).tokens.find((t) => t.id === chosen && t.chain === "ethereum");
      if (!token) throw new Error("Create and select an Ethereum token blueprint first.");
      const wallet = window.ethereum;
      if (!wallet || typeof wallet.request !== "function") throw new Error("Connect a wallet that supports the EIP-1193 Ethereum provider API.");
      const chain = await wallet.request({ method: "eth_chainId" });
      if (BigInt(chain) !== 11155111n) throw new Error("Switch your wallet to Ethereum Sepolia testnet (chain 11155111).");
      const accounts = await wallet.request({ method: "eth_requestAccounts" });
      const from = accounts?.[0];
      if (!address(from)) throw new Error("Wallet did not return a valid Ethereum account.");
      const response = await fetch("/erc20-sepolia-artifact.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Compiler artifact not published.");
      const artifact = await response.json();
      if (artifact.chainId !== 11155111 || artifact.audited !== false || !/^0x[0-9a-fA-F]{200,}$/.test(artifact.bytecode))
        throw new Error("Unexpected or invalid testnet contract artifact.");
      const data = artifact.bytecode + encodeTokenConstructor(token);
      report("Please confirm the testnet contract deployment and gas cost in your wallet.");
      const txHash = await wallet.request({ method: "eth_sendTransaction", params: [{ from, data, value: "0x0" }] });
      if (!transaction(txHash)) throw new Error("Wallet did not return a transaction hash.");
      report("Submitted testnet transaction " + txHash + "; awaiting network receipt…");
      let receipt = null;
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        receipt = await wallet.request({ method: "eth_getTransactionReceipt", params: [txHash] });
        if (receipt) break;
      }
      if (!receipt) throw new Error("Receipt not yet available; inspect the transaction hash in your wallet.");
      if (BigInt(receipt.status) !== 1n || !address(receipt.contractAddress))
        throw new Error("Testnet deployment reverted or no contract was created.");
      const expected = BigInt(token.supply) * 10n ** BigInt(token.decimals);
      const supply = await wallet.request({ method: "eth_call", params: [
        { to: receipt.contractAddress, data: "0x18160ddd" }, "latest"
      ] });
      const balance = await wallet.request({ method: "eth_call", params: [
        { to: receipt.contractAddress, data: selectorBalance + from.slice(2).toLowerCase().padStart(64, "0") }, "latest"
      ] });
      if (BigInt(supply) !== expected || BigInt(balance) !== expected)
        throw new Error("A transaction was recorded, but the expected on-chain supply/balance did not verify.");
      state.testnetDeployments = [...(Array.isArray(state.testnetDeployments) ? state.testnetDeployments : []).slice(-19), {
        tokenId: token.id, contractAddress: receipt.contractAddress, txHash,
        owner: from, chainId: 11155111, createdAt: new Date().toISOString(),
        status: "testnet-verified-at-time-of-query"
      }];
      save();
      render();
    } catch (error) {
      report(error?.message || "Unable to deploy testnet token.", true);
      button.disabled = false;
    }
  });
}
