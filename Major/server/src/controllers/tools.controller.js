import dotenv from "dotenv";

dotenv.config();

const GITHUB_API = "https://api.github.com";

const languageExtensions = {
  javascript: [".js", ".jsx", ".mjs", ".cjs"],
  typescript: [".ts", ".tsx"],
  python: [".py"],
  java: [".java"],
  c: [".c", ".h"],
  cpp: [".cpp", ".hpp", ".cc", ".cxx"],
  go: [".go"],
  ruby: [".rb"],
  php: [".php"],
  swift: [".swift"],
};

function extMatches(fileName, lang) {
  const key = (lang || "").toLowerCase();
  const exts = languageExtensions[key];
  if (!exts) return true; // if unknown language, include all
  return exts.some((e) => fileName.toLowerCase().endsWith(e));
}

async function fetchJson(url, init = {}) {
  const headers = {
    "User-Agent": "skillswap-analyzer",
    Accept: "application/vnd.github+json",
    ...init.headers,
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "skillswap-analyzer",
      Accept: "application/vnd.github.raw",
    },
  });
  if (!res.ok) throw new Error(`Fetch raw error ${res.status}`);
  return res.text();
}

async function listRepoFiles(owner, repo, path = "", acc = []) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const items = await fetchJson(url);
  for (const item of items) {
    if (item.type === "dir") {
      await listRepoFiles(owner, repo, item.path, acc);
    } else if (item.type === "file") {
      acc.push({ path: item.path, download_url: item.download_url, name: item.name });
    }
  }
  return acc;
}

export const repoVerify = async (req, res) => {
  try {
    const { repoUrl, language } = req.body;
    if (!repoUrl) return res.status(400).json({ message: "Missing repo URL" });

    const match = repoUrl.match(/github\.com\/(.*?)\/(.*?)(?:\.git)?(?:\/?|#|$)/i);
    if (!match) return res.status(400).json({ message: "Invalid GitHub URL" });

    const owner = match[1];
    const repo = match[2];

    const files = await listRepoFiles(owner, repo);
    const codeFiles = files.filter((f) => extMatches(f.name, language));

    let totalLines = 0;
    let longestFile = "";
    let longestLines = 0;

    // Limit to 50 files to avoid excessive bandwidth
    const sample = codeFiles.slice(0, 50);
    for (const f of sample) {
      try {
        const content = await fetchText(f.download_url);
        const lines = content.split(/\r?\n/).length;
        totalLines += lines;
        if (lines > longestLines) {
          longestLines = lines;
          longestFile = f.path;
        }
      } catch (e) {
        // skip file on error
      }
    }

    const totalFiles = codeFiles.length;
    const scannedFiles = sample.length;
    const avgLinesPerFile = scannedFiles ? Math.round(totalLines / scannedFiles) : 0;

    return res.status(200).json({
      totalFiles,
      scannedFiles,
      avgLinesPerFile,
      longestFile,
    });
  } catch (error) {
    console.error("repoVerify error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
