// One-off: unpack ../COLLECTO.html (bundled prototype) into reference sources + static assets.
// Usage: node scripts/extract-prototype.mjs [path/to/COLLECTO.html]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const src = path.resolve(process.argv[2] ?? path.join(root, "..", "COLLECTO.html"));
const html = fs.readFileSync(src, "utf8");

const block = (type) => {
  const m = html.match(new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`));
  if (!m) throw new Error(`missing __bundler/${type}`);
  return JSON.parse(m[1]);
};
const manifest = block("manifest");
const template = block("template");
const asset = (id) => {
  const v = manifest[id];
  let b = Buffer.from(v.data, "base64");
  if (v.compressed) b = zlib.gunzipSync(b);
  return b;
};

const out = (rel, data) => {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  console.log("wrote", rel, typeof data === "string" ? data.length : data.length);
};
const dataUriToBuf = (u) => Buffer.from(u.slice(u.indexOf(",") + 1), "base64");
const stripData = (s) => s.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, "DATA_URI");

// --- JS modules ---
const core = asset("be1534b3-6483-4137-a3fa-eca1c3735ad9").toString("utf8");
const vm = asset("59775208-2fef-426d-9600-40f543f148ff").toString("utf8");
out("reference/logic-core.js", stripData(core));
out("reference/view-models.js", stripData(vm));

// --- template + app class ---
const i = template.indexOf("data-dc-script");
const appClass = template.slice(template.indexOf(">", i) + 1, template.indexOf("</script>", i));
out("reference/app-class.js", appClass);
const markup = template
  .replace(/url\("data:[^"]*"\)/g, 'url("DATA_URI")')
  .replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, "DATA_URI");
out("reference/template.html", markup);

// --- photos ---
const one = (re) => core.match(re)?.[1];
const list = (re) => [...(core.match(re)?.[1] ?? "").matchAll(/'([^']*)'/g)].map((m) => m[1]);
const owner = one(/OWNER_PHOTO='([^']*)'/);
if (owner) out("public/images/avatars/owner.jpg", dataUriToBuf(owner));
list(/RPHOTOS=\[([^\]]*)\]/).forEach((u, k) => u && out(`public/images/avatars/rider-${k + 1}.jpg`, dataUriToBuf(u)));
list(/[^R]PHOTOS=\[([^\]]*)\]/).forEach((u, k) => u && out(`public/images/avatars/customer-${101 + k}.jpg`, dataUriToBuf(u)));

// --- map ---
const map = template.match(/\.map-img\{[^}]*url\("(data:image\/jpeg;base64,[^"]+)"\)/);
if (map) out("public/images/map.jpg", dataUriToBuf(map[1]));

// --- icons (CSS mask SVGs) ---
for (const m of template.matchAll(/\.(ic-[a-z-]+|gpin)\{[^}]*?url\("data:image\/svg\+xml,([^"]+)"\)/g)) {
  out(`public/icons/${m[1]}.svg`, decodeURIComponent(m[2]));
}
