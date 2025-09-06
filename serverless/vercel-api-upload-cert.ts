// Example Vercel serverless function to commit a PDF into your repo at public/certs/<id>.pdf
// Deploy this in a Vercel project under `api/upload-cert.ts` (or rename accordingly).
// Env vars required (set in Vercel):
// - GITHUB_TOKEN: fine-grained PAT with Contents:Read/Write on this repo
// - GITHUB_OWNER: e.g., "arunkmr08"
// - GITHUB_REPO: e.g., "Certificate-Generator"
// - TARGET_BRANCH: e.g., "main" (defaults to main)

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const origin = req.headers.get('origin') || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  } as Record<string, string>;
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.API_KEY;
    if (expectedKey && apiKey !== expectedKey) return new Response('Unauthorized', { status: 401, headers });

    const { certificateId, filename, contentBase64 } = await req.json();
    if (!certificateId || !filename || !contentBase64) {
      return new Response('Missing fields', { status: 400, headers });
    }

    const owner = process.env.GITHUB_OWNER!;
    const repo = process.env.GITHUB_REPO!;
    const branch = process.env.TARGET_BRANCH || 'main';
    const path = `public/certs/${filename}`;
    const token = process.env.GITHUB_TOKEN!;

    // Check if file exists to get its SHA (required for update)
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    let sha: string | undefined;
    const getResp = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'certgen-uploader' } });
    if (getResp.ok) {
      const data = await getResp.json();
      sha = data.sha;
    }

    // Create or update the file
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const body = {
      message: `chore(cert): publish ${filename} for ${certificateId}`,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    };
    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'certgen-uploader',
      },
      body: JSON.stringify(body),
    });

    if (!putResp.ok) {
      const text = await putResp.text();
      return new Response(text || 'GitHub API error', { status: putResp.status, headers });
    }
    return new Response('OK', { status: 200, headers });
  } catch (e: any) {
    return new Response('Server Error', { status: 500, headers });
  }
}

