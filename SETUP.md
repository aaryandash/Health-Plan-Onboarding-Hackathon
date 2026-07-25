# Setup — 3 minutes

Do this **before** the hackathon starts.

## 1. Stop Claude appearing as a contributor on our repo

Open `~/.claude/settings.json` (Windows: `C:\Users\<you>\.claude\settings.json`) and add this top-level key:

```json
"includeCoAuthoredBy": false
```

If the file is empty or missing, the entire file should be:

```json
{ "includeCoAuthoredBy": false }
```

Restart Claude Code afterwards — the setting applies to new sessions.

## 2. Set your git identity

Use your **real GitHub email**, otherwise your commits won't be credited to you.

```bash
git config --global user.name "Your Name"
git config --global user.email "your@github.email"
git config --global pull.rebase true
```

Verify — this must print your email, not a hostname:

```bash
git config --global user.email
```

## 3. Clone and run

```bash
git clone https://github.com/aaryandash/med-hack-template.git
cd med-hack-template
npm install
npm run dev
```

Open http://localhost:3000.

## 4. Read `CLAUDE.md` before you prompt anything

Check the file-ownership table. Only edit your files. That table is the whole reason we won't spend hour 12 resolving merge conflicts.

## 5. Working rules

- Branch: `yourname/feature`. Never commit straight to `main`.
- Commit every ~20 minutes.
- Use plan mode (Shift+Tab twice) before letting Claude write anything substantial.
