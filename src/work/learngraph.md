---
lede: >-
  LearnGraph is the backend of an adaptive learning platform for Class 11 and 12 Chemistry (NCERT,
  for JEE and NEET). It keeps a knowledge graph of the syllabus, models how each student's memory of
  each concept fades, and generates passages and questions aimed at the concepts they're weakest
  on. The next subtopic unlocks only when they've mastered the current one.
problem: >-
  Most practice tools serve the same questions to everyone and treat a concept as done once it's
  answered right. Memory doesn't work that way. LearnGraph tracks what each student knows, how fast
  they're forgetting it, and which prerequisites are holding them back, then writes the next session
  around exactly that.
role: Backend
flow:
  - name: Build the student's context
    detail: >-
      Mastery per subtopic and per concept, the wrong answers from the last three sessions, and
      prerequisites one and two hops away in the Neo4j graph, each with its own mastery.
  - name: Allocate the questions
    detail: >-
      The weakest concepts are mapped to question slots, each with a Bloom's cognitive level and a
      target difficulty set from the student's effective mastery.
  - name: Reuse, or generate
    detail: >-
      If the passage and question banks in Postgres already have fitting content, it's reused.
      Otherwise Claude writes a 220–260 word passage and its questions as JSON, with prompt caching.
  - name: Score and update mastery
    detail: >-
      Each answer updates per-concept mastery (an exponential moving average), a forgetting curve
      R = e^(−t/S) with a half-life ladder of 1, 3, 7, 14, 30 and 60 days, and a velocity signal.
  - name: Sync the graph
    detail: >-
      Mastery is written onto KNOWS edges between the student and each concept in Neo4j, and the
      next subtopic unlocks at mastery 0.6.
decisions:
  - title: Exponential forgetting, not linear
    why: >-
      Forgetting is fastest right after learning and slows sharply over time. An exponential curve
      matches that; a linear one would over-review fresh material and under-review old material.
  - title: A half-life per concept
    why: >-
      Concepts a student has mastered get reviewed less, weak ones more. This is the central idea of
      Duolingo's half-life regression paper, applied per concept.
  - title: Velocity alongside decay
    why: >-
      Decay changes slowly. Velocity reacts the moment a student's performance changes, so a sudden
      slump shows up in the next session, not the next week.
  - title: IRT to choose questions, not to grade students
    why: >-
      Item response theory calibrates each question's difficulty (after 5+ attempts) and how well it
      separates strong from weak students (after 20+). Serving the most informative questions first
      gets more signal from every answer.
  - title: Prerequisites in a graph database
    why: >-
      Prerequisites form a directed acyclic graph. Recursive "what does this depend on" queries are
      natural in Cypher and awkward in SQL, and mastery lives on the edges without joins.
  - title: Generate the next session ahead of time
    why: >-
      Generation takes 3–8 seconds. Running it in the background for the next subtopic means the
      student never waits for it.
numbers:
  - value: '325'
    label: Concepts in the graph
    note: Across 25 chapters and 101 subtopics.
  - value: 1 → 60 days
    label: Review half-life ladder
    note: 1, 3, 7, 14, 30, 60.
  - value: '0.6'
    label: Mastery needed to unlock the next subtopic
  - value: 10 / 15 min
    label: Generation requests per student
    note: Rate limit that keeps the model bill predictable.
stack:
  - Express 5
  - Prisma
  - Neon
  - Neo4j Aura
  - Zod
status: >-
  The backend is built; I worked on it with a frontend collaborator. Not built yet: a learned
  half-life, a review queue that acts on the decay it measures, and per-student ability estimates.
sources:
  - label: Source code
    href: https://github.com/Ayushjo/learngraph-backend
---

LearnGraph grew out of one observation from the roadmap: a system that measures memory decay but
never acts on it is only keeping a diary. Everything in the backend exists to turn what it knows
about a student into the next twenty minutes of study.

That starts with knowing the syllabus as a structure, not a list. 325 concepts sit in a Neo4j graph
with explicit prerequisite edges, so when a student keeps missing questions on one idea, the backend
can look one and two steps back and see whether the real gap is earlier.

The memory model is built from published research rather than invented: Ebbinghaus's forgetting
curve, the SM-2 review intervals, Duolingo's half-life regression, and item response theory for the
questions themselves. Each one answers a different question: how much has the student forgotten,
when should they review, how fast are they changing, and which question will tell us the most.

Generation is the expensive step, so it's used as little as possible. Content is reused from banks
when it fits, prompts are cached, the next session is prepared in the background, and each student
has a rate limit.
