# HopeAI Impact — Volunteer Planning Milestones

**Status: browser-local engineering beta; no identity verification, payments or real donations.**

HopeAI Impact action boards now support **suggested owner labels**, **planned UTC due
dates**, and a summary of unscheduled, unassigned, overdue and upcoming actions.

## What the user can do

1. Open **HopeAI Impact** and create a local campaign action board.
2. Add a volunteer/planning action with an optional suggested owner and an
   optional calendar due date.
3. Edit planning details using **Edit suggested owner / planned due date**
   on any action without losing its completion status.
4. Complete or reopen actions, review percentage complete, and see counts for
   past due or due within the next seven days, calculated using **UTC** dates.
5. Create a separate local HopeAI action plan from the campaign as before.

Suggested owner means a planning **label only**: it is not an authenticated
assignment, invitation, employee record or confirmation that anyone accepted.

## Contracts and validation

`public/impact-schedule.mjs` exposes:
- `planningOwner(value)` — optional trimmed plain-text label, maximum 80 characters.
- `planningDate(value)` — an optional strict ISO date `YYYY-MM-DD` between
  years 2000 and 2100; nonexistent calendar dates are rejected.
- `impactScheduleSummary(campaign, today)` — deterministic counts for open,
  completed, unassigned, scheduled, past due and due within seven days. Only
  **open** tasks affect late/upcoming totals; the caller supplies the UTC day.

`public/workflows.mjs` now accepts optional `ownerLabel` and `dueDate` in
`addImpactTask` and exports `updateImpactTaskSchedule` for updating these
fields on an existing task. The legacy normalization retains valid imported
planning fields and strips invalid due dates or malformed labels, while preserving
task titles and completed/unfinished status.

## Privacy and launch boundaries

- Campaigns, tasks, owner labels and dates are stored in `localStorage` and
  never sent to a server by these controls. Browser cleanup can delete them.
- No authentication, verified identity, external scheduling invitation, email,
  SMS, donation transaction, nonprofit vetting or volunteer contact is provided.
- Plans never assert `charityVerified` or `moneyMoved` is true.
- Do not put sensitive beneficiary information, passwords, private contact
  records or payment data in the planning labels.
- Date summaries are planning reminders, **not** scheduled notifications.
- A production collaboration feature would need user accounts, role-based
  access, participation consent, durable data, background jobs, audit records,
  privacy/retention policies and tested backups.

## Verification

`npm run check && npm test && npm run verify` covers syntax, calendar
validation, owner labels, migration, immutable scheduling, UTC due-date
classification, static hosting and existing release gates.
