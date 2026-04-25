// WebinarJam Video Downloader
// Scriptable — create a new script in the app and paste this in
//
// Usage:
//   - Open Scriptable and run directly → shows URL input form
//   - Open replay in Safari → Share Sheet → Scriptable → this script → skips input form
//
// Saves MP4 to Files → iCloud Drive → Scriptable

// ─── HTML Templates ──────────────────────────────────────────────────────────

const INPUT_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background: #1c1c1e;
  color: #fff;
  padding: 64px 24px 40px;
  min-height: 100vh;
}
h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
.sub { color: #8e8e93; font-size: 15px; line-height: 1.5; margin-bottom: 40px; }
input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: none;
  background: #2c2c2e;
  color: #fff;
  font-size: 16px;
  outline: none;
  -webkit-appearance: none;
}
input::placeholder { color: #636366; }
button {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  background: #0a84ff;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  margin-top: 14px;
  cursor: pointer;
  -webkit-appearance: none;
}
button:active { opacity: 0.75; }
.err { color: #ff453a; font-size: 14px; margin-top: 12px; display: none; }
</style>
</head>
<body>
<h1>Webinar<br>Downloader</h1>
<p class="sub">Paste a WebinarJam replay URL to download the video to your device.</p>
<input type="url" id="url"
  placeholder="https://event.webinarjam.com/…"
  autocorrect="off" autocapitalize="off" spellcheck="false" />
<button onclick="go()">Download Video</button>
<p class="err" id="err">Please enter a valid URL.</p>
<script>
function go() {
  const url = document.getElementById('url').value.trim();
  if (!url.startsWith('http')) {
    document.getElementById('err').style.display = 'block';
    return;
  }
  completion(url);
}
document.getElementById('url').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') go();
});
</script>
</body>
</html>`

const LOADING_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, sans-serif;
  background: #1c1c1e;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  padding: 40px;
  text-align: center;
}
.spinner {
  width: 52px;
  height: 52px;
  border: 4px solid #3a3a3c;
  border-top-color: #0a84ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
h2 { font-size: 22px; font-weight: 600; }
p { color: #8e8e93; font-size: 15px; line-height: 1.5; }
</style>
</head>
<body>
<div class="spinner"></div>
<h2 id="title">Working…</h2>
<p id="sub"></p>
</body>
</html>`

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setStatus(wv, title, sub) {
  await wv.evaluateJavaScript(
    `document.getElementById('title').textContent = ${JSON.stringify(title)};
     document.getElementById('sub').textContent = ${JSON.stringify(sub)};`
  )
}

async function dismissLoader(wv, promise) {
  await wv.evaluateJavaScript('completion(null)')
  await promise
}

async function showError(wv, wvPromise, title, message) {
  await dismissLoader(wv, wvPromise)
  let a = new Alert()
  a.title = title
  a.message = message
  a.addCancelAction("OK")
  await a.present()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// 1. Get URL — Share Sheet passes it directly, otherwise show input form
let replayURL = null

if (args.urls && args.urls.length > 0) {
  replayURL = args.urls[0].toString()
} else {
  let inputWV = new WebView()
  await inputWV.loadHTML(INPUT_HTML)
  replayURL = await inputWV.present(true)
}

if (!replayURL) {
  Script.complete()
  return
}

// 2. Show loading screen (present without await so it runs concurrently)
let loadingWV = new WebView()
await loadingWV.loadHTML(LOADING_HTML)
let loadingPromise = loadingWV.present(true)

// 3. Fetch the page server-side (no CORS restrictions in Scriptable)
await setStatus(loadingWV, "Fetching Page", "Downloading page source…")

let pageHTML
try {
  let req = new Request(replayURL)
  req.headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": replayURL
  }
  pageHTML = await req.loadString()
} catch (e) {
  await showError(loadingWV, loadingPromise, "Fetch Failed", e.message)
  Script.complete()
  return
}

// 4. Extract video URL from page source
await setStatus(loadingWV, "Extracting URL", "Scanning page source for video…")

const patterns = [
  { re: /"file"\s*:\s*"(https?:\/\/[^"]+\.mp4[^"]*)"/, hls: false },
  { re: /src=["'](https?:\/\/[^"']+\.mp4[^"']*)["']/, hls: false },
  { re: /(https?:\/\/[a-z0-9\-]+\.cloudfront\.net\/[^"'\s]+\.mp4)/, hls: false },
  { re: /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/, hls: true },
  { re: /wj_replay_url\s*[=:]\s*["']([^"']+)["']/, hls: false }
]

let videoURL = null
let isHLS = false

for (let { re, hls } of patterns) {
  let m = pageHTML.match(re)
  if (m && m[1]) {
    videoURL = m[1]
    isHLS = hls
    break
  }
}

if (!videoURL) {
  await showError(
    loadingWV, loadingPromise,
    "No Video Found",
    "Couldn't find the video URL in the page source. The player probably loads via JavaScript after the page renders.\n\nOpen the replay in Safari, let the video start playing, then run this script again from the Share Sheet."
  )
  Script.complete()
  return
}

if (isHLS) {
  await dismissLoader(loadingWV, loadingPromise)
  Pasteboard.copyString(videoURL)
  let a = new Alert()
  a.title = "HLS Stream Detected"
  a.message = "The video is an HLS stream (.m3u8) and can't be saved as a single file here. The URL has been copied to your clipboard.\n\nPaste it into VLC to stream, or use a-Shell:\nffmpeg -i \"<url>\" -c copy replay.mp4"
  a.addCancelAction("OK")
  await a.present()
  Script.complete()
  return
}

// 5. Download the video
await setStatus(loadingWV, "Downloading", "This may take a few minutes for long recordings…")

let videoData
try {
  let dlReq = new Request(videoURL)
  dlReq.headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": replayURL
  }
  videoData = await dlReq.loadData()
} catch (e) {
  await showError(loadingWV, loadingPromise, "Download Failed", e.message)
  Script.complete()
  return
}

// 6. Save to iCloud Drive / Scriptable
await setStatus(loadingWV, "Saving", "Writing file…")

let rawName = (videoURL.match(/[^\/]+\.mp4/) || ["webinarjam-replay.mp4"])[0].split("?")[0]
let fm = FileManager.iCloud()
let filePath = fm.joinPath(fm.documentsDirectory(), rawName)
fm.write(filePath, videoData)

await dismissLoader(loadingWV, loadingPromise)

let done = new Alert()
done.title = "Saved"
done.message = `${rawName}\n\nFind it in Files → iCloud Drive → Scriptable`
done.addCancelAction("OK")
await done.present()

Script.complete()
