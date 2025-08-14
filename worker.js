export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env, req) });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response("BotPad API is running", { headers: { "content-type": "text/plain" } });
    }

    if (!url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    try {
      if (url.pathname === "/api/connect" && req.method === "POST") {
        const body = await req.json();
        const { repo, mode, token } = parseConnectBody(body);
        const gh = await getGitHub(env, repo, mode, token);
        const meta = await gh("/repos/" + repo);
        const branch = meta.default_branch || "main";
        return json({ branch });
      }

      if (url.pathname === "/api/tree" && req.method === "GET") {
        const repo = q(url, "repo");
        const branch = q(url, "branch") || "main";
        const mode = q(url, "mode") || "app";
        const token = q(url, "token") || "";
        assertRepo(repo);
        const gh = await getGitHub(env, repo, mode, token);
        const ref = await gh(`/git/refs/heads/${branch}`);
        const commitSha = ref.object.sha;
        const commit = await gh(`/git/commits/${commitSha}`);
        const tree = await gh(`/git/trees/${commit.tree.sha}?recursive=1`);
        return json({ branch, tree: tree.tree || [] });
      }

      if (url.pathname === "/api/file" && req.method === "GET") {
        const repo = q(url, "repo");
        const branch = q(url, "branch") || "main";
        const path = q(url, "path");
        const mode = q(url, "mode") || "app";
        const token = q(url, "token") || "";
        assertRepo(repo);
        if (!path) throw new Error("Path required");
        const gh = await getGitHub(env, repo, mode, token);
        const file = await gh(`/contents/${pathToUrl(path)}?ref=${encodeURIComponent(branch)}`);
        const content = file.content ? atob(file.content.replace(/\n/g, "")) : "";
        return json({ path, sha: file.sha, content });
      }

      if (url.pathname === "/api/commit" && req.method === "POST") {
        const { repo, branch = "main", path, content, message = "Update", sha, mode = "app", token = "" } = await req.json();
        assertRepo(repo);
        if (!path) throw new Error("Path required");
        const gh = await getGitHub(env, repo, mode, token);
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${pathToUrl(path)}`, {
          method: "PUT",
          headers: baseHeaders(await gh.token()),
          body: JSON.stringify({ message, content: btoa(content), branch, sha: sha || undefined })
        });
        const out = await res.json();
        if (!res.ok) return json({ error: "GitHub error", details: out }, res.status);
        return json(out);
      }

      if (url.pathname === "/api/delete" && req.method === "POST") {
        const { repo, branch = "main", path, message = "Delete", sha, mode = "app", token = "" } = await req.json();
        assertRepo(repo);
        if (!path || !sha) throw new Error("Path and sha required");
        const gh = await getGitHub(env, repo, mode, token);
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${pathToUrl(path)}`, {
          method: "DELETE",
          headers: baseHeaders(await gh.token()),
          body: JSON.stringify({ message, branch, sha })
        });
        const out = await res.json();
        if (!res.ok) return json({ error: "GitHub error", details: out }, res.status);
        return json(out);
      }

      if (url.pathname === "/api/env" && (req.method === "GET" || req.method === "POST")) {
        await ensureSchema(env);
        if (req.method === "GET") {
          const repo = q(url, "repo");
          const branch = q(url, "branch") || "main";
          const r = await env.DB.prepare("SELECT content FROM env_files WHERE repo=? AND branch=?").bind(repo, branch).first();
          return json({ content: r?.content || "" });
        } else {
          const { repo, branch = "main", content = "" } = await req.json();
          await env.DB
            .prepare("INSERT INTO env_files(repo,branch,content,updated_at) VALUES(?1,?2,?3,datetime('now')) ON CONFLICT(repo,branch) DO UPDATE SET content=excluded.content, updated_at=datetime('now')")
            .bind(repo, branch, content)
            .run();
          return json({ ok: true });
        }
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message || String(err) }, 400);
    }

    function q(u, k) { return u.searchParams.get(k) || ""; }

    function parseConnectBody(b) {
      if (!b || typeof b !== "object") throw new Error("JSON body required");
      const repo = (b.repo || "").trim();
      assertRepo(repo);
      const mode = (b.mode || "").trim().toLowerCase() === "pat" ? "pat" : "app";
      const token = (b.token || "").trim();
      return { repo, mode, token };
    }

    function assertRepo(repo) {
      if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error("Invalid repository format. Use owner/repo");
    }

    function json(data, status = 200, headers = {}) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "content-type": "application/json",
          ...corsHeaders(env, req),
          ...headers
        }
      });
    }
  }
};

function baseHeaders(token) {
  return {
    "authorization": `Bearer ${token}`,
    "accept": "application/vnd.github+json",
    "user-agent": "botpad-worker"
  };
}

function corsHeaders(env, req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",")
    : ["https://agentcode.pages.dev"]).map((o) => o.trim());
  const headers = {
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-pat",
    "access-control-max-age": "86400"
  };
  if (allowed.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
  }
  return headers;
}

async function getGitHub(env, repo, mode, pat) {
  if (mode === "pat") {
    if (!pat) throw new Error("Token required for PAT mode");
    const tokenFn = async () => pat;
    const gh = async (path, init = {}) => {
      const res = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers: baseHeaders(await tokenFn()), ...init });
      const j = await res.json();
      if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(j)}`);
      return j;
    };
    gh.token = tokenFn;
    return gh;
  }

  const appId = env.GITHUB_APP_ID;
  const pkcs8 = env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !pkcs8) throw new Error("App secrets missing");

  const jwt = await signAppJWT(appId, pkcs8);

  const repoMeta = await fetch(`https://api.github.com/repos/${repo}/installation`, {
    headers: { "authorization": `Bearer ${jwt}`, "accept": "application/vnd.github+json", "user-agent": "botpad-worker" }
  });
  const instJson = await repoMeta.json();
  if (!repoMeta.ok) throw new Error(`GitHub API ${repoMeta.status}: ${JSON.stringify(instJson)}`);
  const installation_id = instJson.id;

  const tokenRes = await fetch(`https://api.github.com/app/installations/${installation_id}/access_tokens`, {
    method: "POST",
    headers: { "authorization": `Bearer ${jwt}`, "accept": "application/vnd.github+json", "user-agent": "botpad-worker" }
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`GitHub API ${tokenRes.status}: ${JSON.stringify(tokenJson)}`);
  const token = tokenJson.token;

  const tokenFn = async () => token;
  const gh = async (path, init = {}) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers: baseHeaders(await tokenFn()), ...init });
    const j = await res.json();
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(j)}`);
    return j;
  };
  gh.token = tokenFn;
  return gh;
}

async function signAppJWT(appId, pkcs8Pem) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now - 60, exp: now + 540, iss: appId };
  const header = { alg: "RS256", typ: "JWT" };
  const enc = (obj) => base64url(JSON.stringify(obj));
  const unsigned = enc(header) + "." + enc(payload);
  const key = await importPKCS8(pkcs8Pem);
  const sigBuf = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, new TextEncoder().encode(unsigned));
  const signature = base64url(sigBuf);
  return `${unsigned}.${signature}`;
}

function base64url(input) {
  let bytes;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else bytes = new Uint8Array(input);
  let base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
}

async function importPKCS8(pem) {
  const b64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", raw.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function ensureSchema(env) {
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS env_files (
      repo TEXT NOT NULL,
      branch TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (repo, branch)
    );
  `);
}

function pathToUrl(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}
