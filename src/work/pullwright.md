---
lede: >-
  Pullwright turns a GitHub issue into a reviewed draft pull request. It plans the change, edits
  code in a sandbox with no network, runs the repository's own tests, has an independent reviewer
  check the diff, and opens the PR only when you click publish. You approve at every step: the
  plan, the files, and the publish. It's a hosted product with a free tier, paid plans and a live
  demo that needs no account.
problem: >-
  Coding agents tend to either need hand-holding the whole way or quietly do something you didn't
  ask for: guess at a vague issue, rewrite a file to make one change, delete a failing test to get
  green, run up a model bill. Pullwright is built so that nothing ships until you approve it, a
  vague issue gets a question instead of a guess, and every task has a hard spending cap.
flow:
  - name: Prepare
    detail: >-
      Clone on the host (the GitHub token travels through git's environment and is never written
      to disk), install dependencies, then run the test suite once to record a baseline.
  - name: Plan
    detail: >-
      In a read-only sandbox it builds a repo map, reads AGENTS.md, and runs a grounding check
      that flags files and symbols the issue mentions but the repo doesn't have. The output is a
      plan with requirements, steps and files, which you approve.
  - name: Run
    detail: >-
      A single agent loop in a sandbox with no network: edit tools, a shell, update_plan,
      ask_user and finish, with a detector that notices when the agent is going in circles.
  - name: Validate
    detail: >-
      A deterministic gate checks the diff, tests, syntax and scope first. Then an independent
      reviewer reads the change against the requirements, with one round of fixes allowed.
  - name: Publish
    detail: >-
      On your click: a fresh clone, apply the accepted patch, commit, push, and open a draft PR.
decisions:
  - title: The API never touches Docker; the worker never accepts traffic
    why: >-
      The API runs on Railway and the worker runs on an EC2 box next to a Docker daemon. They talk
      only through Redis and Postgres, so the machine that runs untrusted code has no inbound
      port, and the public server never runs a container.
  - title: Small patches, never whole-file rewrites
    why: >-
      Edits go through apply_patch and exact str_replace, and each edit is syntax-checked and
      reverted if it breaks the file. The first version of the agent once deleted 344 lines of a
      486-line file to make a one-line change; the rewrite made it as +1/−0.
  - title: A deterministic gate before any model reviews anything
    why: >-
      It rejects empty diffs, gutted files, deleted tests, lockfile churn, files that weren't in
      the plan and new syntax errors. Every one of those rules is a failure I saw in a real run:
      scope creep, an agent deleting a failing test, an empty PR.
  - title: A grounding check before planning
    why: >-
      Added after the agent was given an issue that referenced files that didn't exist, and
      invented both of them. Now a missing file or symbol is flagged up front, and a vague issue
      gets a question instead of a guess.
  - title: Spend is reserved before the call, not counted after
    why: >-
      Every model call goes through one ledger, and each task's cap is reserved atomically before
      the request goes out, so parallel calls can't overshoot it. There's also an operator kill
      switch.
  - title: The model depends on the plan, chosen by measurement
    why: >-
      Haiku on the free plan, because at one to two cents a task it matched everything else
      measured. Sonnet for Pro, because it was the only model that passed the whole ladder. Opus
      only for vague issues, where it scored 7/8 against 4/8.
numbers:
  - value: 34/40
    label: Issues solved, Claude Haiku
    note: >-
      40 eval issues (easy, real-repo, hard, image, vague, very vague), scored by hidden acceptance
      tests. One run each, small eval repos.
  - value: $0.016
    label: Average cost per task, Haiku
    note: The whole 40-issue run cost $0.66.
  - value: 10/10
    label: Hard issues, Sonnet and Opus
    note: Sonnet 34/40 overall at $0.18 a task; Opus 36/40 at $0.43.
  - value: ~2 min
    label: Typical live-demo run
    note: About one cent each. Each visitor gets two runs a day.
  - value: $0.15
    label: Default spending cap per task
    note: Scales with plan size; a run that hits it can be continued for +$0.10.
  - value: '6'
    label: LLM providers behind one gateway
    note: Anthropic, Gemini, OpenAI, OpenRouter, Groq and Vercel AI Gateway, with per-role lanes and failover.
stack:
  - Express 5
  - Prisma
  - React 19
  - Vite
  - Railway
  - AWS EC2
  - gVisor (optional)
status: >-
  Live at pullwright.iayush.com with free and Pro plans. Next: per-provider budgets in the spend
  ledger, and asking harder on vague issues.
sources:
  - label: Source code (MyOwnDevin)
    href: https://github.com/Ayushjo/MyOwnDevin
  - label: pullwright.iayush.com
    href: https://pullwright.iayush.com
  - label: Live demo
    href: https://pullwright.iayush.com/demo
  - label: A recorded run, step by step
    href: https://pullwright.iayush.com/r/8e9c51d8-f35c-4623-b365-5c745a7ae01d
---

Pullwright started in June as **MyOwnDevin**, with a planner, an executor and a verifier passing
work between them. It opened pull requests, but not good ones. One was empty. One deleted 344
lines of a 486-line file. In another run, the agent got the tests to pass by deleting the test that
failed.

So the agent core was rewritten in one long night. The new design does less with the model and
more with plain code around it. Before the model writes anything, the run already knows which
tests pass. While it writes, every edit is a small checked patch that is reverted if it breaks the
file. Afterwards, rules no model can talk its way past catch the empty diff, the gutted file, the
deleted test. Only then does a second model read the change against the checklist it was given.

Every rule in the gate was added for a run that went wrong in exactly that way, which makes them
cheap to explain and hard to argue with. The [overnight log](https://github.com/Ayushjo/MyOwnDevin)
records each failure next to the fix that came from it.

The model choice was also measured, not picked. I ran the same 40 issues through Haiku, Sonnet and
Opus. Haiku solved 34 for about a cent and a half each. That's why the free plan runs on it, and
why the expensive model is kept for the issues that actually need judgment.
