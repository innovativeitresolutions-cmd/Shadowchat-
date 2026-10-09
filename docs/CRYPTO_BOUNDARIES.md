# Crypto / Web3 capability boundaries

This repository intentionally separates **UI/domain capability** from **verified external execution**.

## What is implemented in this baseline

- Watch-only public address registration for Ethereum-style EVM addresses and Solana public addresses.
- A network registry surface for Ethereum, Polygon, Base, BNB Smart Chain, and Solana.
- Explicit user-facing boundaries for transaction signing, broadcasting, swaps, staking, mining, NFTs, custody, token deployment, and exchange connectivity.
- Security behavior that rejects seed phrases and private keys from the watch-only workflow.
- A release capability endpoint (`/api/capabilities`) that reports external crypto execution as disabled/unverified.

## What is not implemented or not verified

- Private-key or seed-phrase custody.
- Wallet creation or recovery.
- Transaction signing.
- Transaction broadcasting.
- Deposits or withdrawals.
- Live blockchain balance lookup.
- Exchange or DEX settlement.
- Staking contract execution or validator delegation.
- Mining network participation.
- NFT minting or deployed NFT contracts.
- Custodial or non-custodial payment execution.
- Compliance certification, KYC/AML verification, or money-transmission authorization.

## Legacy SKY naming and tokenomics

Historical SKYCOIN4444 source snapshots use both `SKY4` and `SKY444` labels. They also contain multiple economic engines with inconsistent assumptions around supply, rewards, staking yield, burns, and internal balances. Those historical constants are useful as design material but are **not evidence of a deployed token or enforceable token economics**.

Before a real token launch, one canonical specification would be required covering at least:

1. token name/symbol and chain;
2. contract address and audited source;
3. immutable or governed supply policy;
4. mint/burn authority;
5. treasury and vesting controls;
6. staking/reward source and sustainability;
7. upgradeability/admin keys;
8. custody model;
9. deployment transactions and block explorer evidence;
10. legal/regulatory review appropriate to the intended jurisdictions and product behavior.

## Legacy custody warning

A historical EVM HD-wallet implementation described itself as “non-custodial” while deriving wallet keys server-side from a server master mnemonic. Server-side derivation of user signing keys is a **server-controlled key-management/custody risk** regardless of the comment label. That pattern is not carried into this baseline.

## Marketplace and crypto

Marketplace prices in this baseline are reference values only. Orders do not trigger card payments, crypto transfers, escrow deposits, token settlement, shipping, or seller payouts. The lawful marketplace also blocks controlled substances, weapons, stolen credentials/goods, malware, forged identity documents, and counterfeit currency.

## Games and crypto

Game credits are deterministic demo points with no cash/token value. No wager, deposit, withdrawal, payout, prize, token transfer, cryptographic RNG claim, or regulated-gambling capability is provided.

## Evidence standard

Future crypto capabilities should only be marked “live” after there is reproducible evidence such as deployed addresses, transaction hashes, provider configuration, funded test accounts, failure-path tests, security review, and an operational rollback/incident plan. Documentation alone is not proof of deployment.
