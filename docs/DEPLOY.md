# How to Put AnswerFlow Online

## What you're doing

You're going to put AnswerFlow on the internet so anyone with the link can use it. This is a one-time setup. After it's done, you can update it whenever you want with one command.

This costs a few dollars a month (roughly $2–5 depending on usage). The service is called **Fly.io** — it runs your app on a real server and keeps your data safe even when you push updates.

---

## What you need first

1. **A Fly.io account** — sign up for free at https://fly.io
2. **A credit card** — Fly.io needs one on file to create apps (you won't be charged until you deploy)
3. **The Fly command-line tool** — this is the program you type commands into to control your app

To install the Fly tool, open a terminal and run the right command for your computer:

**Windows** (open PowerShell and paste this):
```
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**macOS or Linux** (open Terminal and paste this):
```
curl -L https://fly.io/install.sh | sh
```

What this installs: a small program called `fly` that you can use from your terminal to create, deploy, and manage your app on Fly.io.

---

## Step 1 — Sign in

Run this in your terminal:
```
fly auth login
```

What it does: opens your web browser so you can sign in to your Fly.io account. Once you sign in, come back to the terminal.

---

## Step 2 — Create the app and its storage

Run these two commands one at a time:

```
fly launch --no-deploy
```

What this does: reads the setup file that's already included (`fly.toml`) and creates your app on Fly.io without actually starting it yet. It will ask you a couple of questions — you can press Enter to accept the defaults.

```
fly volumes create answerflow_data --size 1 --region iad
```

What this does: creates a 1 gigabyte disk on Fly's servers. This disk is where all your questionnaire data lives — questions, answers, everything. It stays safe even when you push updates to your app. If you want your app to run in a different city (for example, closer to your users), change `iad` to a different region code from https://fly.io/docs/reference/regions/

---

## Step 3 — Put it online

Run:
```
fly deploy
```

What it does: packages up AnswerFlow, sends it to Fly.io, and starts it running. This takes a few minutes the first time. You'll see a progress bar in your terminal. When it's done, it will print a line saying "Deployed" and show you the URL.

---

## Step 4 — Open it

Run:
```
fly open
```

What it does: opens your app in your web browser. Fly.io also prints the full URL in your terminal so you can share it.

To quickly confirm the app is healthy, open this address in your browser (replace the example URL with your own):
```
https://answerflow-staging.fly.dev/api/health
```

You should see: `{"status":"ok"}` — that means the server is running and healthy.

---

## What's already inside

AnswerFlow comes pre-loaded with sample questions and answers so it isn't empty when you first look at it. You don't need to do anything — it's ready to use right after the first deploy.

---

## Updating later

When you want to push changes, just run:
```
fly deploy
```

That's it. Your data is not affected — it lives on the separate disk you created in Step 2.

**Starting over with fresh data:** if you want to wipe everything and go back to the original sample data, run these two commands:

```
fly volumes destroy answerflow_data
fly volumes create answerflow_data --size 1 --region iad
fly deploy
```

What this does: deletes the disk with your current data, creates a brand-new empty disk, then deploys the app fresh. The first boot will automatically load the original sample data again.

---

## If something goes wrong

Run this to see what your app is doing:
```
fly logs
```

This shows a live log of what's happening on the server — errors, startup messages, and anything else useful.

One thing to know: the very first deploy compiles a database driver from source code, which can take a couple of extra minutes. That's normal. If the health check at `/api/health` takes a little longer than expected the first time, just wait a moment and try again.
