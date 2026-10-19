// Browser-only ShadowChat feed. Every entry belongs to the current browser;
// never imply remote delivery, multiple users, moderation or server persistence.
export const MAX_LOCAL_POSTS = 100;
export const MAX_LOCAL_REPLIES = 20;
const MAX_POST_CHARS = 500;
const MAX_REPLY_CHARS = 280;
const IDENTIFIER = /^[a-zA-Z0-9_-]{1,100}$/;

function requireId(id) {
  if (typeof id !== "string" || !IDENTIFIER.test(id)) {
    throw new TypeError("Invalid local entry identifier.");
  }
  return id;
}

function requireText(text, limit, label) {
  if (typeof text !== "string") throw new TypeError(label + " must be text.");
  const value = text.trim();
  if (!value || value.length > limit || [...value].some(char => {
    const code = char.charCodeAt(0);
    return (code < 32 && code !== 9 && code !== 10) || code === 127;
  })) throw new RangeError(label + " must be 1–" + limit + " safe characters.");
  return value;
}

function safeTimestamp(value) {
  if (typeof value !== "string" || value.length > 40 || Number.isNaN(Date.parse(value))) {
    return "";
  }
  return new Date(value).toISOString();
}

function normalizeReply(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  try {
    return {
      id: requireId(raw.id), text: requireText(raw.text, MAX_REPLY_CHARS, "Reply"),
      createdAt: safeTimestamp(raw.createdAt)
    };
  } catch { return null; }
}

function normalizePost(raw, index) {
  const input = typeof raw === "string" ? { id: "legacy-" + index, text: raw } : raw;
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  try {
    const id = requireId(input.id);
    const seenReplies = new Set();
    const replies = [];
    for (const item of Array.isArray(input.replies) ? input.replies.slice(0, MAX_LOCAL_REPLIES) : []) {
      const reply = normalizeReply(item);
      if (!reply || seenReplies.has(reply.id)) continue;
      seenReplies.add(reply.id);
      replies.push(reply);
    }
    return {
      id, text: requireText(input.text, MAX_POST_CHARS, "Post"),
      createdAt: safeTimestamp(input.createdAt), likedByMe: input.likedByMe === true,
      replies
    };
  } catch { return null; }
}

export function normalizeLocalPosts(raw) {
  if (!Array.isArray(raw)) return [];
  // The original beta appended plain strings; newer records use newest-first.
  const legacy = raw.every(item => typeof item === "string");
  const source = legacy ? raw.slice(-MAX_LOCAL_POSTS).reverse() : raw.slice(0, MAX_LOCAL_POSTS);
  const seen = new Set();
  return source.map((value, index) => normalizePost(value, index)).filter(post => {
    if (!post || seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

function existingPost(posts, id) {
  const safeId = requireId(id);
  if (!posts.some(post => post.id === safeId)) throw new Error("Unknown local post.");
  return safeId;
}

export function createLocalPost(posts, text, id, createdAt = new Date().toISOString()) {
  const current = normalizeLocalPosts(posts);
  if (current.length >= MAX_LOCAL_POSTS) throw new RangeError("Local feed is full; delete an older post.");
  const safeId = requireId(id);
  if (current.some(post => post.id === safeId)) throw new Error("Duplicate local post ID.");
  const body = requireText(text, MAX_POST_CHARS, "Post");
  return [{ id: safeId, text: body, createdAt: safeTimestamp(createdAt),
    likedByMe: false, replies: [] }, ...current];
}

export function editLocalPost(posts, id, text) {
  const current = normalizeLocalPosts(posts);
  const safeId = existingPost(current, id);
  const body = requireText(text, MAX_POST_CHARS, "Post");
  return current.map(post => post.id === safeId ? { ...post, text: body } : post);
}

export function deleteLocalPost(posts, id) {
  const current = normalizeLocalPosts(posts);
  const safeId = existingPost(current, id);
  return current.filter(post => post.id !== safeId);
}

export function toggleLocalLike(posts, id) {
  const current = normalizeLocalPosts(posts);
  const safeId = existingPost(current, id);
  return current.map(post => post.id === safeId
    ? { ...post, likedByMe: !post.likedByMe } : post);
}

export function addLocalReply(posts, postId, text, replyId, createdAt = new Date().toISOString()) {
  const current = normalizeLocalPosts(posts);
  const safePostId = existingPost(current, postId);
  const safeReplyId = requireId(replyId);
  const body = requireText(text, MAX_REPLY_CHARS, "Reply");
  const post = current.find(item => item.id === safePostId);
  if (post.replies.length >= MAX_LOCAL_REPLIES) {
    throw new RangeError("This local post has the maximum number of replies.");
  }
  if (post.replies.some(item => item.id === safeReplyId)) throw new Error("Duplicate reply ID.");
  return current.map(item => item.id === safePostId
    ? { ...item, replies: [...item.replies, { id: safeReplyId, text: body,
      createdAt: safeTimestamp(createdAt) }] } : item);
}

export function deleteLocalReply(posts, postId, replyId) {
  const current = normalizeLocalPosts(posts);
  const safePostId = existingPost(current, postId);
  const safeReplyId = requireId(replyId);
  const post = current.find(item => item.id === safePostId);
  if (!post.replies.some(reply => reply.id === safeReplyId)) throw new Error("Unknown local reply.");
  return current.map(item => item.id === safePostId
    ? { ...item, replies: item.replies.filter(reply => reply.id !== safeReplyId) } : item);
}
