import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_LOCAL_POSTS, MAX_LOCAL_REPLIES, normalizeLocalPosts, createLocalPost,
  editLocalPost, deleteLocalPost, toggleLocalLike,
  addLocalReply, deleteLocalReply,
} from "../public/social.mjs";

test("legacy plain-string posts migrate without making up a remote user", () => {
  const migrated = normalizeLocalPosts(["Older local note", "Newer local note"]);
  assert.equal(migrated.length, 2);
  assert.equal(migrated[0].text, "Newer local note");
  assert.match(migrated[0].id, /^legacy-/);
  assert.equal(migrated[0].createdAt, "");
  assert.equal(migrated[0].likedByMe, false);
  assert.deepEqual(migrated[0].replies, []);
});

test("new posts are validated, newest-first, immutable, and individually identified", () => {
  const original = [];
  const first = createLocalPost(original, "First local note", "post_one", "2026-10-19T00:00:00Z");
  const second = createLocalPost(first, "  Second local note  ", "post_two", "2026-10-19T01:00:00Z");
  assert.deepEqual(original, []);
  assert.equal(first.length, 1);
  assert.equal(second[0].text, "Second local note");
  assert.equal(second[0].id, "post_two");
  assert.equal(second[0].createdAt, "2026-10-19T01:00:00.000Z");
  assert.equal(second[0].likedByMe, false);
  assert.equal(second[1].id, "post_one");
  assert.throws(() => createLocalPost(second, "duplicate", "post_two"), /Duplicate/);
});

test("posts can be edited and deleted without mutating other local drafts", () => {
  const first = createLocalPost([], "First", "first");
  const second = createLocalPost(first, "Second", "second");
  const updated = editLocalPost(second, "first", "Changed original");
  assert.equal(second[1].text, "First");
  assert.equal(updated[1].text, "Changed original");
  assert.equal(updated[0].text, "Second");
  const deleted = deleteLocalPost(updated, "second");
  assert.deepEqual(deleted.map(post => post.id), ["first"]);
  assert.throws(() => editLocalPost(deleted, "missing", "x"), /Unknown/);
  assert.throws(() => deleteLocalPost(deleted, "missing"), /Unknown/);
});

test("reactions are strictly personal local booleans, with no invented counts", () => {
  const initial = createLocalPost([], "My thoughts", "local-id");
  const liked = toggleLocalLike(initial, "local-id");
  assert.equal(liked[0].likedByMe, true);
  assert.equal(initial[0].likedByMe, false);
  assert.equal(toggleLocalLike(liked, "local-id")[0].likedByMe, false);
  assert.equal(Object.hasOwn(liked[0], "likes"), false);
  assert.equal(Object.hasOwn(liked[0], "remoteDelivery"), false);
});

test("replies form an isolated local thread and support deletion", () => {
  const posts = createLocalPost(createLocalPost([], "One", "one"), "Two", "two");
  const withReply = addLocalReply(posts, "one", "  Reply here ", "reply-1",
    "2026-10-19T03:00:00Z");
  assert.equal(withReply.find(x => x.id === "one").replies[0].text, "Reply here");
  assert.equal(withReply.find(x => x.id === "two").replies.length, 0);
  assert.equal(posts.find(x => x.id === "one").replies.length, 0);
  assert.throws(() => addLocalReply(withReply, "one", "Again", "reply-1"), /Duplicate/);
  const gone = deleteLocalReply(withReply, "one", "reply-1");
  assert.deepEqual(gone.find(x => x.id === "one").replies, []);
  assert.throws(() => deleteLocalReply(gone, "one", "reply-1"), /Unknown/);
});

test("post and reply capacity limits are enforced without silent loss", () => {
  let posts = [];
  for (let i = 0; i < MAX_LOCAL_POSTS; i++) {
    posts = createLocalPost(posts, "Local note " + i, "post" + i);
  }
  assert.equal(posts.length, MAX_LOCAL_POSTS);
  assert.throws(() => createLocalPost(posts, "Overflow", "extra"), /full/);
  let thread = createLocalPost([], "Discussion", "thread");
  for (let i = 0; i < MAX_LOCAL_REPLIES; i++) {
    thread = addLocalReply(thread, "thread", "Reply " + i, "reply" + i);
  }
  assert.equal(thread[0].replies.length, MAX_LOCAL_REPLIES);
  assert.throws(() => addLocalReply(thread, "thread", "Last", "too-many"), /maximum/);
});

test("untrusted localStorage content is bounded and malformed entries are omitted", () => {
  const bad = [
    {id: "bad id", text: "Invalid ID"},
    {id: "oversized", text: "x".repeat(501)},
    {id: "missing"},
    {id: "safe-id", text: "Valid", likedByMe: "true", remoteDelivery: true,
      replies: [
        {id:"reply-ok", text:"Good reply", createdAt:"not-a-date", likes:10000},
        {id:"reply-ok", text:"Same ID"},
        {id:"invalid space", text:"No"},
      ]},
    {id: "safe-id", text: "Duplicate ID"},
    {id: "with-controls", text: "Before" + String.fromCharCode(0) + "After"},
  ];
  const clean = normalizeLocalPosts(bad);
  assert.equal(clean.length, 1);
  assert.equal(clean[0].likedByMe, false);
  assert.equal(clean[0].replies.length, 1);
  assert.equal(clean[0].replies[0].createdAt, "");
  assert.deepEqual(Object.keys(clean[0]), ["id", "text", "createdAt", "likedByMe", "replies"]);
  assert.deepEqual(normalizeLocalPosts({payload:"not array"}), []);
  assert.equal(normalizeLocalPosts(new Array(200).fill("local text")).length, 100);
});

test("user text validation prevents empty, oversized, control and non-string content", () => {
  for (const invalid of [" ", "", "x".repeat(501), "unsafe" + String.fromCharCode(0), 123]) {
    assert.throws(() => createLocalPost([], invalid, "valid-id"));
  }
  assert.throws(() => createLocalPost([], "safe", "invalid id"), TypeError);
  assert.throws(() => addLocalReply(createLocalPost([], "Safe", "good"), "good",
    "x".repeat(281), "reply-id"), RangeError);
  assert.throws(() => addLocalReply([], "missing", "text", "reply-id"), /Unknown/);
});

test("deleting a post also deletes its entire local reply thread", () => {
  const p = addLocalReply(createLocalPost([], "Only this device", "post-a"),
    "post-a", "My local comment", "reply-a");
  assert.equal(p[0].replies.length, 1);
  assert.deepEqual(deleteLocalPost(p, "post-a"), []);
  assert.equal(normalizeLocalPosts([{id:"x", text:"Valid", likedByMe:true}])[0].likedByMe, true);
});
