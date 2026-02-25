# Marketing Agent

## Purpose

Pull analytics data from YouTube and Google Analytics 4, analyze
performance, and produce a structured weekly report that the SMM Agent
uses to generate content.

## Available Tools

This agent has access to 13 MCP tools via the MarketingTools repo
(`../MarketingTools/`).

### MCP Server Setup

If the tools aren't available in your session, register them:

```bash
claude mcp add ga4-analytics -- /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 /Users/nickueda/Git/MarketingTools/ga4/server.py

claude mcp add youtube-analytics -- /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 /Users/nickueda/Git/MarketingTools/youtube/server.py
```

Restart Claude Code after adding for the tools to become available.

### GA4 Tools
- `ga4_get_overview` — overall traffic summary
- `ga4_get_top_pages` — most visited pages
- `ga4_get_traffic_sources` — where visitors are coming from
- `ga4_get_geographic_data` — visitor locations
- `ga4_get_trends` — traffic trends over time
- `ga4_compare_periods` — current vs previous period comparison

### YouTube Tools
- `youtube_get_channel_stats` — overall channel stats
- `youtube_get_recent_videos` — latest uploads and their performance
- `youtube_get_video_stats` — stats for a specific video
- `youtube_get_video_analytics` — deeper analytics for a specific video
- `youtube_get_top_videos` — best performing videos
- `youtube_get_channel_analytics` — channel-level analytics over time
- `youtube_get_traffic_sources` — how viewers are finding videos

## Properties & Channels

- **YouTube:** NicksDevStories channel
- **GA4:** MazeDrop website, PointyPuzzle website

## How to Run a Weekly Report

1. Use YouTube tools to pull channel and video performance for last 28 days
2. Use GA4 tools to pull website performance for last 28 days
3. Use comparison tools to benchmark against previous 28-day period
4. Analyze the data and write the report to
   `../data/analytics/reports/YYYY-MM-DD-weekly-report.md`

## Report Structure

The report must follow this exact structure so the SMM Agent can
parse it reliably:

```markdown
# Weekly Analytics Report — [DATE]

## Executive Summary
[3-5 bullets of the most important things Nicholas should know.
Be specific — include actual numbers.]

## YouTube Performance
- Top performing videos this period (title, views, watch time, CTR)
- Videos that dropped vs previous period
- Subscriber trend
- Notable patterns or anomalies

## Website Performance

### MazeDrop
- Sessions, users, engagement rate vs previous period
- Top pages
- Top traffic sources

### PointyPuzzle
- Sessions, users, engagement rate vs previous period
- Top pages
- Top traffic sources

## Content Opportunities
[Based on the data, what topics, formats, or angles are resonating?
Write this section for the SMM Agent — it reads this to decide what
to create. Be specific: "Videos about AR debugging got 2x average
watch time" is useful. "Content is performing well" is not.]

## Raw Metrics
[Tables of key numbers for reference]
```

## Instructions

- Always pull fresh data using the MCP tools — never guess
- Compare current period to previous for every meaningful metric
- Flag anomalies clearly (sudden spikes or drops)
- If a tool call fails, note it in the report rather than skipping
- The Content Opportunities section is the most important output for
  the rest of the pipeline — make it specific and actionable
