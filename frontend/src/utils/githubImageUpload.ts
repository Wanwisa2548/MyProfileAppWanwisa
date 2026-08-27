// อัปโหลดรูปสินค้าขึ้น GitHub repo แล้วคืนลิงก์ raw.githubusercontent.com กลับมา
// เหตุผลที่ทำแบบนี้: ถ้าส่งรูปเป็น base64 ตรง ๆ ไปที่ backend ของเราเอง
// (119.59.102.161) ตัว reverse proxy ของโฮสติ้งมหาวิทยาลัยจะตัด request
// ที่ body ใหญ่เกินไปทิ้งก่อนถึง Node เลย (413 Payload Too Large)
// การอัปโหลดตรงไป GitHub API แทน ทำให้ request ที่ยิงไป backend ของเรา
// เหลือแค่ URL สั้น ๆ จึงไม่มีทางโดน 413 อีก

const GITHUB_API_ORIGIN = "https://api.github.com";

type GitHubConfig = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  folder: string;
};

function getGitHubConfig(): GitHubConfig {
  const owner = process.env.EXPO_PUBLIC_GITHUB_OWNER?.trim();
  const repo = process.env.EXPO_PUBLIC_GITHUB_REPO?.trim();
  const branch = process.env.EXPO_PUBLIC_GITHUB_BRANCH?.trim() || "master";
  const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN?.trim();
  const folder = process.env.EXPO_PUBLIC_GITHUB_IMAGE_PATH?.trim() || "product-images";

  if (!owner || !repo || !token) {
    throw new Error(
      "Image hosting on GitHub is not configured yet. Please set EXPO_PUBLIC_GITHUB_OWNER, EXPO_PUBLIC_GITHUB_REPO, and EXPO_PUBLIC_GITHUB_TOKEN in frontend/.env, then restart the app."
    );
  }

  return { owner, repo, branch, token, folder };
}

function sanitizeFileName(name: string): string {
  const extMatch = name.match(/\.(jpg|jpeg|png|webp)$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
  const base =
    name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40) || "product";
  return `${base}${ext}`;
}

/**
 * Uploads a base64 data URL (e.g. "data:image/jpeg;base64,....") to the
 * configured GitHub repo via the Contents API and returns a public
 * raw.githubusercontent.com URL that can be stored in the `image` column.
 */
export async function uploadImageToGitHub(dataUrl: string, fileName: string): Promise<string> {
  const { owner, repo, branch, token, folder } = getGitHubConfig();

  const commaIndex = dataUrl.indexOf(",");
  const base64Content = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;

  const safeName = sanitizeFileName(fileName);
  const path = `${folder}/${Date.now()}-${safeName}`;

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API_ORIGIN}/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add product image ${safeName}`,
        content: base64Content,
        branch,
      }),
    });
  } catch {
    throw new Error("Could not reach GitHub. Please check your internet connection and try again.");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = result?.message || `GitHub upload failed (${response.status})`;
    throw new Error(reason);
  }

  const downloadUrl: string | undefined = result?.content?.download_url;
  if (!downloadUrl) {
    throw new Error("GitHub did not return an image URL.");
  }

  return downloadUrl;
}
