# NicksDevStories Agents

Automated marketing and content pipeline for MazeDrop, PointyPuzzle,
and future projects.

## Agents

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| Marketing Agent | Pulls and analyzes YouTube + GA4 analytics | 13 MCP tools via MarketingTools | Weekly report in `data/analytics/reports/` |
| SMM Agent | Generates tweet drafts and YouTube content ideas | Marketing Agent report | `data/tweet-queue.md`, `data/briefs/` |
| Video Editor Agent | Helps produce videos from briefs | SMM briefs + ShortCut output in `data/briefs/` | Works interactively with Nicholas |

## Prerequisites

- Claude Code installed and authenticated
- MarketingTools repo cloned as a sibling directory (`../marketing-tools/`)
  with MCP servers registered — see that repo's README for setup
- ShortCut configured to drop output into `data/briefs/`

## Running Agents via Claude Code

```bash
# Run Marketing Agent (from agents/ directory)
claude --project marketing-agent "Run the weekly analytics pull and generate a report"

# Run SMM Agent
claude --project smm-agent "Read the latest marketing report and generate this week's content"

# Run Video Editor Agent interactively
claude --project video-editor-agent "Read the latest brief and let's work on the video together"
```

## Scheduling (Local Cron)

```bash
# Edit crontab
crontab -e

# Every Monday at 9am — pull analytics and generate report
0 9 * * 1 cd ~/agents && claude --project marketing-agent "Run weekly analytics pull and generate report" >> ~/agents/logs/marketing.log 2>&1

# Every Monday at 10am — generate content from report
0 10 * * 1 cd ~/agents && claude --project smm-agent "Generate this week's content from latest report" >> ~/agents/logs/smm.log 2>&1
```

Note: Make sure your machine is awake at scheduled times. Claude Code must
be authenticated — test headless runs manually before relying on cron.

## Reviewing Tweet Queue

Open `data/tweet-queue.md` to review drafted tweets. Copy and paste
approved tweets directly into Twitter. Mark posted tweets with ✅.
