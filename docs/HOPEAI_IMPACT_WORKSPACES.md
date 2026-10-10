# Actionable HopeAI and Impact workspaces (engineering beta)

## What now works

**HopeAI:** Create goal-specific local action plans for general goals, community/charity, education, or product engineering. Four concrete tasks are generated deterministically from the selected template. Users can mark tasks done/undone, see progress, and delete their plans.

**HopeAI Impact:** Create campaign plans, add and remove up to 30 volunteer/planning actions per campaign, mark them done/undone, track completion, and create a linked HopeAI charity plan directly from a campaign. Legacy browser-saved simple plans are migrated in memory to the richer shape.

## Try the feature

1. Open the beta and choose **HopeAI**. Enter a goal, choose **Action-plan focus**, and create the plan.
2. Mark a step complete; the progress bar and percentage change. Toggle the step again to undo it.
3. Open **HopeAI Impact**. Enter a campaign title, goal, and optional pledge-intent estimate.
4. Add concrete planning/volunteer tasks (e.g., contact coordinator); complete them to track progress.
5. Select **Create HopeAI action plan from this campaign**, which takes you to the linked action plan.

## Security and data boundaries

- All plans and action checklists are stored in the current browser's `localStorage`. **They are not synced across devices or users**, and may be lost if local browser data is cleared.
- No connected LLM or provider is called; templates are fixed, deterministic guidance and should not be represented as model output.
- Pledge amounts remain **intent only**, not receipts, payments, transfers, donations, or verified impact. Campaigns cannot obtain `charityVerified` or `moneyMoved` status by modifying imported data.
- User text is escaped before inserting HTML. Campaign titles, goals, task names, and amounts are validated.
- Browser-local storage does not supply server-side authentication, audited impact reporting, nonprofit verification, payment reconciliation, backup/restore, or moderation.
- Do not enter private credentials or sensitive beneficiary information in local drafts.

## Implementation & verification

- `public/workflows.mjs` — tested deterministic domain functions, validation, task transition logic, migration helpers, and Impact→HopeAI handoff.
- `public/workspaces-ui.mjs` — concrete interactive forms, task boards, completion controls and accessible progress indicators wired into the beta.
- `tests/workflows.test.mjs` — domain/legacy/limit/financial-truthfulness tests.
- `tests/http.test.mjs` — HTTP module delivery and beta health/metadata smoke coverage.
- `npm run check && npm test && npm run verify` — repository quality checks.

No generated files, mock donations, unsupported model connectivity, or LOC padding are part of this upgrade.
