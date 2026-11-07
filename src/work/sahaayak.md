---
lede: >-
  Sahaayak is an AI staff for small Indian businesses. A shop owner talks to it in Hindi, English
  or Hinglish. An orchestrator sends each request to a specialist agent that chases overdue
  payments, keeps the khata, watches cash flow or compares suppliers. An agent factory can hire a
  new specialist on the spot. Nothing leaves the business until the owner taps Approve. This page
  describes the system as we built it for the hackathon and then hardened it for production.
problem: >-
  Big retailers got a software army. The shop owner who runs his business from a notebook, a
  billing app and his memory got tools that assume an IT department. Sahaayak gives him staff,
  not another dashboard: he says what he needs, and agents do the work and wait for his approval.
role: Team lead · backend & AWS platform
flow:
  - name: A group chat, not a dashboard
    detail: >-
      A React workspace where the owner chats with the team and sees which agent answered and how
      the request was routed. Approvals, tasks, documents and reports sit alongside the chat.
  - name: The orchestrator routes
    detail: >-
      FastAPI on AWS Lambda runs a Strands Agents orchestrator that exposes each specialist as a
      tool and decides who should handle the request.
  - name: Specialists do the work
    detail: >-
      Vasool chases payments, Khata tracks cash flow and 90-day terms, Sourcer compares suppliers.
      Nirmata, the agent factory, interviews the owner and spins up a new agent live.
  - name: Every tool call is checked
    detail: >-
      A Cedar policy layer denies by default: each agent gets an allowlist of tools, and every call
      is checked against it, including for agents the factory just created.
  - name: The business has a memory
    detail: >-
      Uploaded documents go to S3, are read by Textract, embedded with Titan v2, auto-tagged, and
      fed into the agents' memory and semantic search.
  - name: Proactive, but approved
    detail: >-
      An EventBridge rule wakes a scheduler every minute. It drafts payment reminders and flags cash
      gaps into an approval queue. The message goes out only after the owner taps Approve.
decisions:
  - title: One seam, two backends
    why: >-
      Every cloud dependency has a local twin behind the same interface: a local store or
      DynamoDB, a console notifier or email, a mock model or Bedrock, files or S3. The demo never
      needs the cloud to be up, and a parity test runs the same suite against both stores to prove
      the swap is safe.
  - title: The mock model drives the real tool loop
    why: >-
      Offline, a deterministic mock model still runs the actual Strands tool loop, so the tests and
      the demo exercise the same code path production uses.
  - title: Default-deny, even for agents the factory makes
    why: >-
      A hired agent can never touch a tool we didn't grant. The factory's agent specs are
      validated with Pydantic, so a generated agent can't grant itself tools either.
  - title: The human keeps the keys
    why: >-
      Every outbound action goes through approval. AI does the work, the owner decides what leaves
      the shop. After the hackathon this became a full approval engine with a durable ledger.
  - title: Nova Lite over Nova Pro, by measurement
    why: >-
      In production the front desk moved to Nova Lite. It scored the same as Nova Pro on the golden
      eval (8/8) and on the full battery, at roughly 4.3× lower cost.
  - title: Serverless, because demos are bursty
    why: >-
      Lambda costs nothing while idle and scales to zero between demo clicks. Deploys run through
      GitHub Actions with OIDC, so no AWS keys are stored anywhere.
numbers:
  - value: 28/28
    label: Production battery
    note: 28 jobs across 12 flows, run against the deployed system.
  - value: $0.0252
    label: Cost of the whole battery
    note: 360,780 tokens, priced from Bedrock-reported usage at public rates. About $0.001 per chat turn.
  - value: 4.0 s
    label: Median chat latency
    note: p95 8.0 s; a cold start takes about 9–10 s.
  - value: '240'
    label: Tests passing
    note: Contract, unit and offline ↔ AWS parity tests on a clean install. The hackathon build had 81.
  - value: '14'
    label: Tenant-scoped DynamoDB tables
  - value: '7'
    label: UI languages
stack:
  - Strands Agents
  - Bedrock Nova Lite
  - Titan Embed v2
  - Lambda
  - DynamoDB
  - S3
  - Textract
  - EventBridge
  - React
  - GitHub Actions (OIDC)
status: >-
  Live at sahaayak.space, built with my co-founder Fahmin, who wrote the frontend and much of the
  deploy. I led the team and owned the backend and AWS platform: provisioning, the Cedar layer,
  the document brain, and after the hackathon the approval engine, multi-tenancy, hybrid retrieval,
  RBAC, the eval harness, CI/CD and the production battery.
sources:
  - label: sahaayak.space
    href: https://www.sahaayak.space
  - label: Product demo (YouTube)
    href: https://youtu.be/4jNoelUtQ9Q
---

Sahaayak began as a hackathon entry built around one person: Ramesh, who sells auto components in
Faridabad. His whole system is a notebook, a billing app and his memory. The question was what
software would look like if it worked for him instead of asking him to learn it.

The answer was a team, not a dashboard. Ramesh types the way he talks, and the orchestrator decides
who should handle it: Vasool for the customer who's late paying, Khata for whether he can afford
the next order, Sourcer for a cheaper supplier. If no one on the team fits, Nirmata asks him a few
questions and hires a new agent with exactly the tools that job needs.

My part was the platform underneath: the AWS stack from zero, the Cedar layer that makes every tool
call ask permission, and the document brain that lets agents answer from his own invoices. After
the hackathon I spent the hardening rounds on what turns a demo into a product: a durable approval
engine, real multi-tenancy with server-side roles, hybrid retrieval with citations, a provider seam
beyond Bedrock with a spending cap, an eval harness, and a production battery that went from 25/28
to 28/28 while its cost fell from $0.118 to $0.025.
