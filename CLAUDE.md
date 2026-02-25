# Agents — Global Context

## Who I Am

My name is Nicholas. I'm an indie developer based in Lafayette, Louisiana.
I build iOS and web games independently, currently working on two projects:

- **MazeDrop** — an iOS AR maze game built with Swift and ARKit
- **PointyPuzzle** — a web-based puzzle game

I use Claude Code heavily in my development workflow and document my process
publicly. I run a YouTube channel called **NicksDevStories** and post
development updates on Twitter.

My goal is to build an authentic audience around my work as a developer —
not just around individual games. I want people to be interested in me as
a creator, not just what I ship.

## My Personality & Voice

- Casual, laid back, writes like I talk
- Positive and uplifting — I never tear anyone down
- Proud of what I build but not cocky — "look what I made" not "look how good I am"
- Honest about the messy parts: bugs, refactors, wrong turns, things that didn't work
- Self-deprecating humor is welcome and natural
- Short and real over polished and produced
- Inspired by Underscore David Smith's style: quiet craftsmanship, no performance

## My Content Platforms

- **YouTube (NicksDevStories)** — devlogs, gameplay, progress updates, technical breakdowns
- **Twitter** — development updates, small wins, honest moments from dev life
- **Websites** — MazeDrop and PointyPuzzle have their own web presence tracked via GA4

## Projects Context

### MazeDrop
- iOS AR game, Swift + ARKit
- Players navigate mazes in augmented reality
- Currently in active development

### PointyPuzzle
- Browser-based puzzle game
- Web technologies stack
- Currently in active development

## External Tools & Repos

### MarketingTools (`../MarketingTools/`)
A sibling repo that provides MCP servers for analytics data. When working
as the Marketing Agent, 13 tools are available automatically:

- **GA4:** ga4_get_overview, ga4_get_top_pages, ga4_get_traffic_sources,
  ga4_get_geographic_data, ga4_get_trends, ga4_compare_periods
- **YouTube:** youtube_get_channel_stats, youtube_get_recent_videos,
  youtube_get_video_stats, youtube_get_video_analytics, youtube_get_top_videos,
  youtube_get_channel_analytics, youtube_get_traffic_sources

No additional setup needed — tools are pre-registered when a Claude Code
session is started.

### ShortCut (`../shortcut/`)
A video production pipeline for creating short-form gaming content
(YouTube Shorts, TikTok). Takes raw gameplay clips and a blueprint JSON
and runs an 8-stage pipeline: frame extraction → blueprint → voiceover →
transcription → validation → audio processing → Remotion render →
final FFmpeg encode.

Projects live at `../shortcut/projects/[game]/`, each with their own
style guide and per-episode video folders. Raw clips go in
`../shortcut/projects/[game]/videos/[ep]/input/`. Final MP4 lands in
`../shortcut/projects/[game]/videos/[ep]/output/`. Blueprint JSON lives at
`../shortcut/projects/[game]/videos/[ep]/pipeline/blueprint.json`.

The Video Editor Agent is responsible for authoring the blueprint JSON
(Stage 1) and then handing off to the pipeline.

## How These Agents Work Together

1. **Marketing Agent** uses MCP tools to pull YouTube and GA4 analytics,
   then writes a structured report to `data/analytics/reports/`
2. **SMM Agent** reads that report and generates tweet drafts and YouTube
   content ideas, writing to `data/tweet-queue.md` and `data/briefs/`
3. **Nicholas** takes the brief, gathers raw gameplay clips, and drops
   them into the appropriate ShortCut episode input folder
4. **Video Editor Agent** reads the brief and the project style guide,
   authors the blueprint JSON, and works interactively with Nicholas
   to run ShortCut's pipeline and produce a finished MP4 for review

## Shared Data Locations

- `data/analytics/reports/` — weekly reports from Marketing Agent
- `data/briefs/` — content briefs from SMM Agent, read by Video Editor
  Agent; also where Video Editor Agent writes YouTube metadata and
  production notes after a video is complete
- `data/content-log/` — content logs tracking published videos with both
  performance data and hand-written annotations. SMM Agent may update
  performance numbers (views, avg view duration, likes, comments, subs)
  but must **never overwrite** annotation fields (hook, structure, VO,
  SFX, overlays, what worked/didn't work) — those are written by
  Nicholas and the Video Editor Agent
- `data/tweet-queue.md` — running queue of drafted tweets awaiting
  Nicholas's review and approval

## General Instructions for All Agents

- Always write output files, never just print to console
- Append to running files (like tweet-queue.md) rather than overwriting
- Include timestamps on all generated content
- Never post, publish, or send anything — Nicholas reviews and approves
  everything manually
- If data is missing or stale, note it clearly rather than guessing
