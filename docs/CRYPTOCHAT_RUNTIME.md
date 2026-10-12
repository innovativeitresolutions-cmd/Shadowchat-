# CryptoChat runtime and token issuance boundaries

This is a self-hostable engineering beta, not a certified financial, custody, messaging, or issuance service. It offers three independent integrations.

## Live multiuser chat

Set CRYPTOCHAT_DATA_FILE to a writable path on a durable single-instance disk, e.g. /data/chat.json. The server supplies username/password registration (Node scrypt salted hashes), HttpOnly SameSite session cookies, same-origin POST protection, message rate limits, room-scoped histories and Server-Sent Events fanout to connected accounts. Another browser signed into the same room can receive real messages immediately.

This file persistence is atomic on a single process but is NOT multi-replica safe. Keep one instance with a mounted persistent volume. Configure HTTPS reverse proxy, request logging hygiene, access controls, backups/restore testing, user account recovery, abuse reporting, privacy and retention rules before offering a public service. Usernames do not constitute identity verification. Rooms are public to any registered user knowing the room slug, and are not end-to-end encrypted.

With no persistent file configured the API returns HTTP 503; never imply active chat or persistence.

## Token minting on Ethereum Sepolia

The token creator can save an Ethereum blueprint, connect an EIP-1193 wallet switched to Sepolia chain 11155111, and explicitly approve a contract creation transaction funded with TEST ETH. The browser deploys the compiled fixed-supply ERC-20 bytecode, checks the transaction receipt and verifies that the intended initial supply belongs to the signer. No private keys or wallet secrets are sent to the SKYCOIN4444 server. No mainnet deployment path is enabled.

The contract is educational, has not undergone independent external audit, has no post-deployment mint authority, cannot be upgraded, and does not claim verified exchange listing, on-chain liquidity, market price, or regulatory approval. The wallet controls gas payment, signing, and chain connectivity.

For optional offline Sepolia deployment, enter the contracts directory, run npm install, then set TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY, TOKEN_DECIMALS, SEPOLIA_RPC_URL and SEPOLIA_DEPLOYER_PRIVATE_KEY **in your own secure local shell** and run npm run deploy:sepolia. Only use a dedicated disposable TESTNET wallet and never commit or share keys. The script refuses every chain except 11155111 and verifies the on-chain supply and initial owner balance before reporting success. Do not use real assets or production keys with this prototype.

## Provider-backed platform membership payment

Only a separate non-investment membership service can use the optional Stripe-hosted checkout. Set STRIPE_SECRET_KEY, STRIPE_SERVICE_PRICE_ID, STRIPE_WEBHOOK_SECRET, STRIPE_LEDGER_FILE and the HTTPS PUBLIC_BASE_URL from the payment provider's approved merchant account. The server creates an allowlisted checkout, sends card entry to Stripe, verifies webhook signatures, and records completed payment only when matched to an earlier server-created session. A success redirect alone is NOT proof of payment.

Protect ledger data with permissions, a durable volume, encrypted backups and recovery drills. No tokens, shares, fundraising orders, escrow, or investment subscriptions are purchasable through this route.

## Securities compliance and investment intake

The existing ICO and IPO workspace is planning-only. Accepting an actual investment may require securities registration or an exemption, licensed intermediaries, purchaser suitability or eligibility and identity checks, offering documents, and other jurisdiction-specific controls. None of these has been independently verified or connected. The SEC's August 2026 Regulation Crypto Assets proposal remains proposed as of October 12, 2026 and must not be treated as a live exemption. A real compliant partner workflow is an integration task, not something the browser or Stripe membership purchase can bypass.

## Release evidence still required

- Isolated two-browser messaging over a deployed HTTPS endpoint.
- Hosted persistent-volume restart, recovery, and concurrency verification.
- Production abuse/moderation workflow, credential recovery and audit logging.
- Blockchain explorer-confirmed Sepolia contract address and transaction.
- Merchant provisioning, webhook delivery, reconciliation and refunds.
- Legal review before any actual security offering, solicitation or investment receipt.

The CI suite verifies domain, real in-process HTTP/SSE chat, payment-signature checks, contract compilation and client artifact parity, but it is not an audit or operational certification.
