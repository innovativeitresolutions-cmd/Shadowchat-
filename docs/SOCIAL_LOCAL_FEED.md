# ShadowChat Browser-Local Social Feed — Engineering Beta

This change makes the existing Social tab usable as a **private, single-browser
draft feed**. It does not implement a social network or imply other users can see
anything.

## User journey

1. Open **Social** and write a post (up to 500 characters).
2. Edit or delete your own browser-local post. Deleting also discards its local replies.
3. Toggle a personal **React locally** heart; this is only a boolean preference
   stored in your own browser, never a public like count.
4. Add up to 20 browser-local replies (280 characters each) to a post. Remove
   individual replies as desired.
5. Export or clear browser data using the existing **Security** tab controls.

A maximum of 100 posts is enforced. When full, writing an additional post is
rejected with an explanation until an older post is removed. The UI provides
keyboard-focus styling, screen-reader button labels and a local error region.

## Compatibility and domain contracts

`public/social.mjs` exports browser-compatible pure functions:

- `normalizeLocalPosts(raw)`: reads legacy plain-text posts and modern post
  objects, drops malformed and duplicate IDs, ignores unsupported fields and
  bounds imported records.
- `createLocalPost(posts, text, id, createdAt)`: validates and prepends a post.
- `editLocalPost(posts, id, text)`, `deleteLocalPost(posts, id)`: edit and erase.
- `toggleLocalLike(posts, id)`: changes only `likedByMe` on your own record.
- `addLocalReply(posts, postId, text, replyId, createdAt)` and
  `deleteLocalReply(posts, postId, replyId)`: local thread actions.

The `posts` collection stays inside the existing `sky4-beta-v3`
`localStorage` document, so compatible older browsers automatically migrate
the prior simple post strings when the Social tab is opened. Unknown imported
fields such as claimed public engagement and delivery status are discarded.
User-supplied text is HTML-escaped at rendering boundaries.

## Explicit limits

- No server storage, login, user identity, participant permissions, private
  messaging, remote feed, live replies, notifications, moderation pipeline,
  report handling, audience, delivery receipts or public reactions exist here.
- Reaction controls measure **only your own local preference**; there is no
  user count or evidence of other people reacting.
- Deleting browser entries clears this local copy only; there is no server
  deletion request because no server record exists.
- Browser storage can be tampered with, cleared or lost; it is not backed up.
  Do not enter passwords, financial credentials or sensitive personal data.
- When building server-backed Social, add authenticated author IDs,
  authorization, durable history, retention and deletion semantics, abuse
  reporting/moderation, rate limiting, observability and verified privacy rules.

## Verification

`npm run check && npm test && npm run verify` executes JS syntax checks,
Social CRUD/migration/privacy/capacity tests, the HTTP serving smoke suite and
unchanged release boundaries. A green merge is **not** a live deployment.
