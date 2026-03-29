# Claude Code Auto Mode — Full Update & Project Handoff Guide
## Updated March 29, 2026

## WHAT'S NEW IN CLAUDE CODE (MARCH 2026)

Auto Mode launched March 24, 2026. It lets Claude make permission decisions automatically — safe operations run without prompting, dangerous ones get blocked. It works on Mac, Linux, and Windows (Windows still has limited features like no computer use/screen control yet, but code editing, file ops, bash, and Auto Mode itself work). Computer Use (screen clicking, navigation, opening apps) launched March 23 but is macOS only for now. The context window is now 1 million tokens by default on Opus 4.6 for Max, Team, and Enterprise plans. That is roughly 750,000 words or an entire large codebase loaded at once. Output tokens doubled to 64k per response. You can now send up to 600 images or PDF pages per request, up from 100. PowerShell Tool preview added for Windows users. Voice speech-to-text now supports 20 languages. Prompt caching can cut costs by 90% and latency by 80%. Session limits are a 5-hour rolling window for burst activity with 50-800 prompts per window depending on your plan.

## WHAT CLAUDE CODE CAN DO RIGHT NOW

Read, write, edit, and create any files in your project. Run bash/terminal commands and scripts. Search your entire codebase by file name or content. Build full features across multiple files from a description. Refactor large codebases. Fix bugs with full context of surrounding code. Write and run tests. Create git commits with proper messages. Push code to GitHub branches. Create pull requests and respond to review comments. Monitor CI/CD pipelines and fix failures. Fetch web pages and search the web for documentation. Read PDFs, images, and Jupyter notebooks. Work with MCP servers for GitHub, databases, and other integrations. Run multiple tasks in parallel using sub-agents. Handle projects with thousands of files using intelligent search and indexing — it does not load everything at once, it searches and loads what it needs.

## HOW TO HAND OFF A BIG PROJECT

Step 1: Create a CLAUDE.md file in the root of your repository. This is the persistent instruction file that every Claude Code session reads automatically. Put everything Claude needs to know in here: project description, tech stack, folder structure, build commands, test commands, coding conventions, what not to touch, and any special instructions.

Step 2: Get all your archives, code previews, and scattered files into ONE repository or folder structure. You do not need to organize them perfectly. Just get them in one place and Claude can sort through them. A good structure would be: /archives (dump all your 20 archives here), /previews (put your 3-4 code previews here), /src (this is where the final website code will be built), and CLAUDE.md at the root.

Step 3: In your handoff message to Claude, include: what the final website should do, which pieces from which archives/previews you want to keep, any design preferences or branding requirements, tech stack preference (React, Next.js, plain HTML, etc.), hosting target (Vercel, Netlify, etc.), and any APIs or integrations needed.

Step 4: Let Claude work. With Auto Mode on, it will read through your archives, identify the best pieces, build the site structure, and assemble everything. You can check in periodically and redirect as needed.

## SAMPLE CLAUDE.md TEMPLATE FOR YOUR PROJECT

```
# Project: [Your Website Name]

## Overview
Building the main website by consolidating code from multiple archive sources and code previews.

## Tech Stack
[Fill in: e.g., Next.js, React, Tailwind CSS, etc.]

## Source Material
- /archives/ — Contains 20 archived projects with reusable components and code
- /previews/ — Contains 3-4 code preview builds to pull the best pieces from

## Build Commands
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Test: npm test

## What To Build
[Describe the website: pages, features, functionality]

## Design Guidelines
[Colors, fonts, branding, layout preferences]

## Rules
- Do not delete archive files, only copy from them
- Keep all code clean and well-structured
- Mobile responsive is required
- [Add your own rules]
```

## LIMITS TO KNOW ABOUT

The 1M token context window is huge but not infinite. If your 20 archives are extremely large, Claude will handle them by searching through them intelligently rather than loading everything at once, so size is not really a blocker. Sessions last up to 5 hours of active work. If a session ends, you can start a new one and pick up where you left off — committed code persists. Max plan gets the most prompts per session (up to 800). Pro plan gets fewer (10-40). For a big project consolidation like yours, Max plan is recommended. Claude cannot browse the internet to view live websites you have hosted, but it can fetch public URLs for reference if needed.

## BOTTOM LINE

Claude Code with Auto Mode is fully capable of taking a large, messy multi-archive project and building a clean, organized website from it. Get your files into one repo, write a CLAUDE.md with your instructions, and hand it off. The 1M context window and intelligent file indexing mean project size is not a real constraint. You are good to go.
