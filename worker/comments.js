// Dashboard comments Worker — GET/POST /comments backed by KV, one array per project slug.

const MAX_COMMENTS = 200;
const MAX_TEXT_LENGTH = 2000;
const MAX_AUTHOR_LENGTH = 80;
const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function kvKey(slug) {
  return `comments:${slug}`;
}

async function handleGet(env, url) {
  const slug = url.searchParams.get("project");
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return jsonResponse({ error: "missing or invalid 'project' query param" }, 400);
  }
  const raw = await env.DASHBOARD_COMMENTS.get(kvKey(slug));
  const comments = raw ? JSON.parse(raw) : [];
  return jsonResponse({ project: slug, comments });
}

async function handlePost(env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  const { project, author, text } = body ?? {};

  if (!project || !SLUG_PATTERN.test(project)) {
    return jsonResponse({ error: "missing or invalid 'project'" }, 400);
  }
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return jsonResponse({ error: "missing 'text'" }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse({ error: `'text' exceeds ${MAX_TEXT_LENGTH} characters` }, 400);
  }
  if (author !== undefined && (typeof author !== "string" || author.length > MAX_AUTHOR_LENGTH)) {
    return jsonResponse({ error: `'author' must be a string up to ${MAX_AUTHOR_LENGTH} characters` }, 400);
  }

  const key = kvKey(project);
  const raw = await env.DASHBOARD_COMMENTS.get(key);
  const comments = raw ? JSON.parse(raw) : [];

  const comment = {
    id: crypto.randomUUID(),
    author: author?.trim() || "匿名",
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  comments.push(comment);
  if (comments.length > MAX_COMMENTS) {
    comments.splice(0, comments.length - MAX_COMMENTS);
  }

  await env.DASHBOARD_COMMENTS.put(key, JSON.stringify(comments));

  return jsonResponse({ ok: true, comment }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname !== "/comments") {
      return jsonResponse({ error: "not found" }, 404);
    }

    if (request.method === "GET") {
      return handleGet(env, url);
    }
    if (request.method === "POST") {
      return handlePost(env, request);
    }

    return jsonResponse({ error: "method not allowed" }, 405);
  },
};
