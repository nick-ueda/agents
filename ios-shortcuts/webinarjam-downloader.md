# WebinarJam Replay Video Downloader — iOS Shortcut

Two shortcuts to handle two failure modes:

- **Shortcut 1** (Regex on raw HTML) — run from anywhere, no Safari needed
- **Shortcut 2** (JS injection in Safari) — run from Safari's Share Sheet after the page has fully loaded; use this when Shortcut 1 finds no URL

WebinarJam's player is JavaScript-rendered, so the video URL may not appear in the raw HTML. If that happens, the JS injection approach queries the live DOM and JW Player API directly.

---

## Shortcut 1: Regex on Raw HTML

Build this manually in the iOS Shortcuts app. Actions are listed in order.

### Actions

**1. Receive Input**
- Receive input from: Share Sheet + Shortcut Input
- Input types: URLs, Text

**2. If** — Shortcut Input does not have any value
- **Ask for Input**
  - Input type: Text
  - Prompt: `Paste the WebinarJam replay URL`
  - Store result in variable: `replayURL`
- **Otherwise** (Shortcut Input has value)
- **Set Variable** — Name: `replayURL`, Value: Shortcut Input
- **End If**

**3. Get Contents of URL**
- URL: `replayURL`
- Method: GET
- Headers:
  - `User-Agent`: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
  - `Accept`: `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
  - `Referer`: `replayURL`

> Note: Desktop User-Agent is required. Mobile UA often gets a stripped page that omits the player config entirely.

**4. Set Variable** — Name: `rawHTML`, Value: Contents of URL

**5. Set Variable** — Name: `videoURL`, Value: (leave empty)

**6. Set Variable** — Name: `isHLS`, Value: (leave empty)

---

**Regex block — try each pattern in order, stop at first match:**

**7. Match Text**
- Text: `rawHTML`
- Pattern: `"file"\s*:\s*"(https?://[^"]+\.mp4[^"]*)"`
- Case sensitive: No
- Store matches in variable: `regexMatch1`

**8. If** — `regexMatch1` has any value
- **Get Item from List** — `regexMatch1`, Get: First Item
- **Set Variable** — `videoURL` = result
- **End If**

**9. If** — `videoURL` does not have any value
- **Match Text** — Text: `rawHTML`, Pattern: `src=["'](https?://[^"']+\.mp4[^"']*)["']`
- Store in `regexMatch2`
- **If** `regexMatch2` has any value → **Set Variable** `videoURL` = First Item of `regexMatch2`
- **End If**
- **End If**

**10. If** — `videoURL` does not have any value
- **Match Text** — Text: `rawHTML`, Pattern: `(https?://[a-z0-9\-]+\.cloudfront\.net/[^"'\s]+\.mp4)`
- Store in `regexMatch3`
- **If** `regexMatch3` has any value → **Set Variable** `videoURL` = First Item of `regexMatch3`
- **End If**
- **End If**

**11. If** — `videoURL` does not have any value
- **Match Text** — Text: `rawHTML`, Pattern: `(https?://[^"'\s]+\.m3u8[^"'\s]*)`
- Store in `regexMatch4`
- **If** `regexMatch4` has any value
  - **Set Variable** `videoURL` = First Item of `regexMatch4`
  - **Set Variable** `isHLS` = `true`
- **End If**
- **End If**

**12. If** — `videoURL` does not have any value
- **Match Text** — Text: `rawHTML`, Pattern: `wj_replay_url\s*[=:]\s*["']([^"']+)["']`
- Store in `regexMatch5`
- **If** `regexMatch5` has any value → **Set Variable** `videoURL` = First Item of `regexMatch5`
- **End If**
- **End If**

---

**HLS branch:**

**13. If** — `isHLS` equals `true`
- **Show Alert**
  - Title: `HLS Stream Detected`
  - Message: `The video is an HLS stream (.m3u8) and can't be saved as a single file by Shortcuts. Options: tap "Open in VLC" to stream it, or tap "Copy URL" and run in a-Shell: ffmpeg -i "<url>" -c copy output.mp4`
  - Buttons: `Open in VLC`, `Copy URL`, `Cancel`
- **If** Chosen Menu Item = `Open in VLC`
  - **Open URL** — URL: `vlc://` + `videoURL`
- **If** Chosen Menu Item = `Copy URL`
  - **Copy to Clipboard** — `videoURL`
- **Stop Shortcut**
- **End If**

---

**No URL found branch:**

**14. If** — `videoURL` does not have any value
- **Show Alert**
  - Title: `Video URL Not Found`
  - Message: `WebinarJam loaded the player via JavaScript after page load, so the URL isn't in the raw HTML. Open the replay in Safari, let the video fully load, then run Shortcut 2 (JS Injection) from Safari's Share Sheet.`
  - Show Cancel button: Yes
- **If** cancelled → **Stop Shortcut**
- **Open URL** — `replayURL`
- **Stop Shortcut**
- **End If**

---

**Download the MP4:**

**15. Get Contents of URL**
- URL: `videoURL`
- Method: GET
- Headers:
  - `User-Agent`: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
  - `Referer`: `replayURL`

**16. Match Text** — Text: `videoURL`, Pattern: `[^/]+\.mp4$`

**17. If** match found
- **Set Variable** `fileName` = First Match
- **Otherwise**
- **Text** — `webinarjam-replay.mp4`
- **Set Variable** `fileName` = result
- **End If**

**18. Save File**
- File: Contents of URL (from step 15)
- Ask where to save: Yes

**19. Show Notification**
- Title: `Download Complete`
- Body: `fileName` + ` saved to Files`

---

## Shortcut 2: JavaScript Injection in Safari

Run from Safari's Share Sheet. Requires the replay page to be open and fully loaded.

### Actions

**1. Run JavaScript on Web Page** — paste the script below exactly as written

```javascript
(function() {
  var result = { url: null, type: null, method: null };

  // Strategy 1: HTML5 <video> element
  var videos = document.querySelectorAll('video');
  for (var i = 0; i < videos.length; i++) {
    var src = videos[i].src || videos[i].currentSrc;
    if (src && src.match(/\.(mp4|m3u8|webm)/i)) {
      result.url = src;
      result.type = src.match(/m3u8/i) ? 'hls' : 'mp4';
      result.method = 'html5-video';
      return JSON.stringify(result);
    }
    var sources = videos[i].querySelectorAll('source');
    for (var j = 0; j < sources.length; j++) {
      if (sources[j].src && sources[j].src.match(/\.(mp4|m3u8)/i)) {
        result.url = sources[j].src;
        result.type = sources[j].src.match(/m3u8/i) ? 'hls' : 'mp4';
        result.method = 'html5-source';
        return JSON.stringify(result);
      }
    }
  }

  // Strategy 2: JW Player global API
  if (typeof jwplayer !== 'undefined') {
    try {
      var playlist = jwplayer().getPlaylist();
      if (playlist && playlist.length > 0) {
        var sources = playlist[0].sources || [];
        var mp4 = sources.find(function(s){ return s.file && s.file.match(/\.mp4/i); });
        var hls = sources.find(function(s){ return s.file && s.file.match(/\.m3u8/i); });
        var chosen = mp4 || hls;
        if (chosen) {
          result.url = chosen.file;
          result.type = chosen.file.match(/m3u8/i) ? 'hls' : 'mp4';
          result.method = 'jwplayer-api';
          return JSON.stringify(result);
        }
      }
    } catch(e) {}
  }

  // Strategy 3: Scan all <script> tags for MP4/m3u8 URLs
  var scripts = document.querySelectorAll('script');
  var urlPattern = /(https?:\/\/[^"'\s\\]+\.(mp4|m3u8)[^"'\s\\]*)/gi;
  for (var k = 0; k < scripts.length; k++) {
    var matches = (scripts[k].textContent || '').match(urlPattern);
    if (matches && matches.length > 0) {
      var mp4Match = matches.find(function(m){ return m.match(/\.mp4/i); });
      result.url = mp4Match || matches[0];
      result.type = result.url.match(/m3u8/i) ? 'hls' : 'mp4';
      result.method = 'script-scan';
      return JSON.stringify(result);
    }
  }

  // Strategy 4: WebinarJam-specific global window variables
  var wjKeys = ['__wj', 'wjConfig', 'wj_replay_url', 'replayUrl', 'videoUrl'];
  for (var l = 0; l < wjKeys.length; l++) {
    var val = window[wjKeys[l]];
    if (val) {
      var str = typeof val === 'string' ? val : JSON.stringify(val);
      var m = str.match(/(https?:\/\/[^"'\s\\]+\.(mp4|m3u8)[^"'\s\\]*)/i);
      if (m) {
        result.url = m[1];
        result.type = result.url.match(/m3u8/i) ? 'hls' : 'mp4';
        result.method = 'wj-global';
        return JSON.stringify(result);
      }
    }
  }

  return JSON.stringify(result);
})();
```

**2. Set Variable** — Name: `jsResult`, Value: Result of JavaScript

**3. Get Dictionary from Input** — Input: `jsResult`

**4. Get Dictionary Value** — Dictionary: result of step 3, Key: `url` → Set Variable `videoURL`

**5. Get Dictionary Value** — Dictionary: result of step 3, Key: `type` → Set Variable `videoType`

**6. If** — `videoURL` has any value

- **If** — `videoType` equals `hls`
  - (same HLS branch as Shortcut 1 step 13)
  - **Stop Shortcut**
- **End If**

- **Get Contents of URL**
  - URL: `videoURL`
  - Method: GET
  - Headers: `User-Agent: Mozilla/5.0 (Macintosh; ...) Chrome/120...`, `Referer`: current page URL

- **Save File** — Ask where to save: Yes

- **Show Notification** — `Download Complete`

- **Otherwise**

- **Show Alert**
  - Title: `No Video Found`
  - Message: `The video URL wasn't found. If the video hasn't started playing yet, press Play, wait a few seconds, then run this Shortcut again from the Share Sheet.`

- **End If**

---

## Decision Flow

```
Run Shortcut 1 with the replay URL
        │
        ├─ MP4 URL found → downloads to Files ✓
        │
        ├─ HLS URL found → open in VLC or copy for a-Shell
        │
        └─ No URL found
                │
                └─ Open replay in Safari
                   Let the video fully load (press Play)
                   Run Shortcut 2 from Share Sheet
                           │
                           ├─ URL found → downloads to Files ✓
                           └─ Still no URL → video may be DRM-protected
```

---

## Limitations

| Issue | Cause | Workaround |
|---|---|---|
| Shortcut 1 returns login page | WebinarJam requires authenticated session | Use Shortcut 2 from Safari (has your cookies) |
| CDN URL expires | CloudFront signs URLs with short TTL (~2-24h) | Download immediately after extracting |
| HLS can't be saved as single file | Shortcuts can't concatenate TS segments | VLC (stream) or a-Shell + ffmpeg |
| DRM-protected content | FairPlay/Widevine encryption | No workaround within iOS sandbox |
| Download times out | File >~2 GB, screen locked, or app backgrounded | Keep screen on; very long recordings may not work |
| "Run JavaScript on Web Page" missing | Only appears when run from Safari Share Sheet | Make sure you invoke from Safari, not Shortcuts app directly |
