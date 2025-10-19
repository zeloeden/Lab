# AI Recreation Guide: Which Documents to Use?

## Quick Answer

**For AI to recreate this app, give it:**
1. ✅ `PRD_LAB_MANAGEMENT_SYSTEM.md` (WHAT to build)
2. ✅ `TECHNICAL_SPEC_FOR_AI.md` (HOW to build it)
3. ✅ This file (Which docs to use when)

**Format:** Markdown (`.md`) is perfect because:
- ✅ AI agents read it easily
- ✅ Code blocks preserve formatting
- ✅ Structure is clear (headings, lists, tables)
- ✅ Portable (GitHub, VS Code, any editor)

---

## Document Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  START HERE: AI_RECREATION_GUIDE.md (this file)    │
│  "Which docs do I need?"                            │
└────────────────┬────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌─────────────────┐   ┌──────────────────────┐
│  PRD (WHAT)     │   │  TECH SPEC (HOW)     │
│  Business logic │   │  Implementation      │
│  User stories   │   │  Code examples       │
│  Data models    │   │  Architecture        │
└─────────────────┘   └──────────────────────┘
      │                     │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │  REFERENCE DOCS     │
      │  (When stuck)       │
      ├─────────────────────┤
      │  • Sessions Flow    │
      │  • Race Condition   │
      │  • Start or Resume  │
      │  • Debug Guide      │
      └─────────────────────┘
```

---

## PRD vs MD: What's the Difference?

### PRD (Product Requirements Document)
**Definition:** A structured document describing WHAT a product does.

**Contents:**
- Business goals
- User personas
- Feature requirements
- Acceptance criteria
- User flows
- Data models

**Format:** Can be Word, PDF, Markdown, Confluence, etc.

**For AI:** PRD in **Markdown format** is best.

---

### MD (Markdown)
**Definition:** Just a file format (like `.docx` or `.pdf`).

**Why it's good for AI:**
- Plain text (no proprietary format)
- Structure via headings (`#`, `##`, `###`)
- Code blocks preserve formatting (` ```typescript `)
- Tables, lists, links all work
- Version control friendly (Git)

**Verdict:** Use Markdown (`.md`) for all documents.

---

## Document Decision Tree

```
Are you an AI agent trying to recreate this app?
    │
    ├─ YES → Read these in order:
    │   1. AI_RECREATION_GUIDE.md (this file)
    │   2. PRD_LAB_MANAGEMENT_SYSTEM.md
    │   3. TECHNICAL_SPEC_FOR_AI.md
    │   4. Build the app!
    │   5. (If stuck) Read debug/flow docs
    │
    └─ NO → Are you a human developer?
        │
        ├─ New to project? → Start with PRD
        │
        ├─ Building a feature? → PRD + Tech Spec
        │
        ├─ Debugging? → Read specific flow doc
        │       ├─ "Prep not found" → PREP_NOT_FOUND_FIX.md
        │       ├─ QR scanning → START_OR_RESUME_FLOW.md
        │       └─ Race condition → RACE_CONDITION_FIX.md
        │
        └─ Onboarding someone? → Give them PRD + this guide
```

---

## For Different AI Agents

### ChatGPT / Claude / GPT-4
**What to give:**
```
"Here are the requirements. Build this app:
[paste PRD_LAB_MANAGEMENT_SYSTEM.md]
[paste TECHNICAL_SPEC_FOR_AI.md]
"
```

**Strengths:**
- Understands business context well
- Can suggest architecture improvements
- Good at explaining tradeoffs

**Weaknesses:**
- May hallucinate APIs that don't exist
- Sometimes skips error handling
- Needs reminders about consistency

**Tips:**
- Start with "Read both documents fully before coding"
- Ask "What's your implementation plan?" first
- Request code in small chunks (one file at a time)

---

### GitHub Copilot / Cursor
**What to give:**
- Open both PRD and Tech Spec in editor
- Put them in workspace root
- Copilot reads them as context

**Strengths:**
- Great at autocomplete from context
- Catches syntax errors instantly
- Learns your coding style

**Weaknesses:**
- Limited context window (may miss big picture)
- Sometimes suggests outdated patterns
- Needs explicit file structure hints

**Tips:**
- Add `// See PRD_LAB_MANAGEMENT_SYSTEM.md for requirements` at top of files
- Use descriptive variable names (AI learns from them)
- Create file structure first, then fill in code

---

### Devin / AutoGPT (Autonomous Agents)
**What to give:**
```
Task: Build a Lab Management System
Documents:
- PRD_LAB_MANAGEMENT_SYSTEM.md (requirements)
- TECHNICAL_SPEC_FOR_AI.md (architecture)
- package.json (dependencies)

Goals:
1. Set up project structure
2. Implement data layer
3. Build core features
4. Add tests
5. Deploy locally

Success criteria:
- User can scan QR and start preparation
- No "Preparation not found" errors
- All E2E tests pass
```

**Strengths:**
- Can run full workflows (setup → build → test)
- Installs dependencies automatically
- Learns from terminal errors

**Weaknesses:**
- May go down wrong paths (needs course correction)
- Can waste time on bikeshedding (perfect variable names)
- Needs explicit success criteria

**Tips:**
- Give clear, measurable goals
- Check in after each major step
- Provide example commands (npm install, npm run dev)

---

## What Each Document Provides

### 1. PRD_LAB_MANAGEMENT_SYSTEM.md

**Purpose:** WHAT the system does (user perspective)

**Use when:**
- ✅ Starting from scratch
- ✅ Understanding business logic
- ✅ Writing user stories
- ✅ Designing UI flows

**Key sections:**
- Executive Summary (30-second overview)
- User Personas (who uses it?)
- Core Features (what does it do?)
- User Flows (step-by-step interactions)
- Data Models (what data is stored?)

**Don't use for:**
- ❌ Implementation details (see Tech Spec)
- ❌ Debugging (see flow/fix docs)

---

### 2. TECHNICAL_SPEC_FOR_AI.md

**Purpose:** HOW to build it (developer perspective)

**Use when:**
- ✅ Writing code
- ✅ Choosing tech stack
- ✅ Setting up project structure
- ✅ Implementing services/components

**Key sections:**
- Tech Stack (React, TypeScript, Dexie, etc.)
- Project Structure (folder layout)
- Implementation Guide (step-by-step code)
- Design Patterns (cache priming, transactions)
- Common Pitfalls (what NOT to do)

**Don't use for:**
- ❌ Business requirements (see PRD)
- ❌ Troubleshooting specific bugs (see fix docs)

---

### 3. SESSIONS_IMPLEMENTATION.md

**Purpose:** Deep dive into session management

**Use when:**
- ✅ Understanding prep flow
- ✅ Debugging session creation
- ✅ Adding session features

**Don't use as primary source** (it's supplementary)

---

### 4. START_OR_RESUME_FLOW.md

**Purpose:** Smart routing logic (start new vs resume vs test)

**Use when:**
- ✅ Implementing QR scan routing
- ✅ Understanding formula → prep → test workflow
- ✅ Adding session resume logic

---

### 5. PREP_NOT_FOUND_FIX.md

**Purpose:** Debugging "Preparation not found" error

**Use when:**
- ✅ Error appears after implementation
- ✅ Cache not working
- ✅ State not passing correctly

**Don't read first** (only if you hit this specific bug)

---

## Recommended Reading Order

### For AI Agents (Building from Scratch)

```
Step 1: Read AI_RECREATION_GUIDE.md (this file)
  ↓
Step 2: Read PRD_LAB_MANAGEMENT_SYSTEM.md
  - Section 1-4: Skim (get overview)
  - Section 5: READ CAREFULLY (data models)
  - Section 6: READ CAREFULLY (architecture)
  - Section 3: Come back to this (features)
  ↓
Step 3: Read TECHNICAL_SPEC_FOR_AI.md
  - Section 1: Skim (tech stack options)
  - Section 2: Implementation Guide - FOLLOW EXACTLY
  - Section 3: Read each code example
  - Section 4: Common Pitfalls - MEMORIZE
  ↓
Step 4: Build the app
  - Follow Step 2-7 from Tech Spec
  - Reference PRD for business rules
  - Check acceptance criteria as you go
  ↓
Step 5: (If errors occur) Read relevant fix doc
  - "Prep not found" → PREP_NOT_FOUND_FIX.md
  - "Loading stuck" → START_OR_RESUME_FLOW.md
```

---

### For Human Developers (Joining Project)

```
Day 1: Read PRD (Sections 1-4)
  - Understand business context
  - Learn user personas
  - Review core features
  ↓
Day 2: Read Tech Spec (Sections 1-2)
  - Understand architecture
  - Set up local environment
  - Run dev server
  ↓
Day 3: Read a flow doc (pick one)
  - START_OR_RESUME_FLOW.md (most important)
  ↓
Week 2: Build a feature
  - Reference PRD for requirements
  - Reference Tech Spec for patterns
```

---

## Quick Reference Table

| Question | Document | Section |
|----------|----------|---------|
| What does this app do? | PRD | Executive Summary |
| Who uses it? | PRD | User Personas |
| How does prep flow work? | PRD | Section 4.1 |
| What data is stored? | PRD | Section 5 |
| What tech stack? | Tech Spec | Section 1 |
| How to set up project? | Tech Spec | Section 2 |
| How to implement sessions? | Tech Spec | Step 6 |
| Why "Prep not found"? | PREP_NOT_FOUND_FIX | Root Cause |
| How does QR routing work? | START_OR_RESUME | Section 2 |
| What's the cache strategy? | RACE_CONDITION_FIX | Layer 2 |

---

## For Non-Technical Stakeholders

**If you need to:**
- ✅ Explain to business stakeholders → Use PRD Sections 1-3
- ✅ Estimate development time → Give Tech Spec to developers
- ✅ Write test cases → Use PRD Section 3 (Acceptance Criteria)
- ✅ Onboard new developers → Give PRD + Tech Spec + this guide

---

## For AI Fine-Tuning / Training

**If training an AI model on this codebase:**

**High priority (train on these):**
1. PRD_LAB_MANAGEMENT_SYSTEM.md (business logic)
2. TECHNICAL_SPEC_FOR_AI.md (implementation patterns)
3. Actual source code (`src/` directory)

**Medium priority (context):**
4. START_OR_RESUME_FLOW.md (routing logic)
5. SESSIONS_IMPLEMENTATION.md (data layer)

**Low priority (debugging only):**
6. PREP_NOT_FOUND_FIX.md
7. RACE_CONDITION_FIX.md

**Why this order?**
- PRD + Tech Spec = 80% of what AI needs
- Flow docs = Edge cases and optimizations
- Fix docs = Only relevant if specific bugs occur

---

## Checklist for AI Agents

Before starting, verify you have:

- [ ] PRD_LAB_MANAGEMENT_SYSTEM.md (full content)
- [ ] TECHNICAL_SPEC_FOR_AI.md (full content)
- [ ] Clear goal (e.g., "Build complete app" or "Add feature X")
- [ ] Access to tools (file creation, terminal, package manager)

While building:

- [ ] Follow Tech Spec steps 1-7 in order
- [ ] Check PRD acceptance criteria for each feature
- [ ] Use exact cache keys specified (`['session', id]`)
- [ ] Implement transaction-safe writes
- [ ] Add retry logic with backoff

Before finishing:

- [ ] Run `npm run dev` (app starts on port 5173)
- [ ] Test QR scan flow (formula → prep → complete)
- [ ] Verify no "Preparation not found" errors
- [ ] Run E2E tests (`npm run test:e2e`)

---

## Summary

### Best Format for AI Recreation: **Markdown (.md)**

**Give AI these files:**
1. `PRD_LAB_MANAGEMENT_SYSTEM.md` (requirements)
2. `TECHNICAL_SPEC_FOR_AI.md` (implementation)
3. `AI_RECREATION_GUIDE.md` (this file)

**Why Markdown?**
- ✅ Plain text (easy to parse)
- ✅ Structure is clear
- ✅ Code blocks preserve formatting
- ✅ All AI agents support it

**Reading order:**
1. Guide (understand structure)
2. PRD (learn requirements)
3. Tech Spec (implement step-by-step)
4. Build!

**When stuck:**
- "Prep not found" → `PREP_NOT_FOUND_FIX.md`
- QR routing → `START_OR_RESUME_FLOW.md`
- Session management → `SESSIONS_IMPLEMENTATION.md`

---

## Final Tips for AI Agents

✅ **Do:**
- Read both PRD and Tech Spec before writing code
- Follow the implementation steps exactly
- Use the code examples as templates
- Ask clarifying questions if something is ambiguous
- Check acceptance criteria as you build

❌ **Don't:**
- Skip the PRD (you'll miss business context)
- Mix cache keys (use `['session', id]` everywhere)
- Return `undefined` from queries (use `?? null`)
- Navigate before cache priming (causes "not found")
- Ignore retry logic (timing issues will occur)

---

**Ready to build?** Start with `TECHNICAL_SPEC_FOR_AI.md` Step 1! 🚀

