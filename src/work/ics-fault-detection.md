---
lede: >-
  A fault and attack detection system for industrial control systems, modelled on the Secure Water
  Treatment (SWaT) testbed and its 51 sensor points. Six agents pass each batch of readings along a
  chain: normalise, classify, assess cyber risk, assess operational risk, decide on a response,
  and coordinate. A React dashboard shows the result live over WebSockets.
problem: >-
  In a water treatment plant, a cyber attack and an ordinary equipment fault can look alike on the
  sensors, and both need a response that weighs safety and downtime, not just a red light. The
  project explores splitting that judgment across agents, from detection through to a recommended
  action that a human approves.
flow:
  - name: Sensor stream
    detail: >-
      Readings from 51 sensors, replayed from CSV in batches of 50 every 3 seconds to simulate a
      live plant.
  - name: Perception
    detail: Normalises the readings (standard scaling plus a power transform).
  - name: Fault detection
    detail: A Random Forest (200 trees, depth 20, balanced class weights) labels each sample normal or attack.
  - name: Cyber risk
    detail: Looks for attack patterns and assigns a threat score and a level from low to critical.
  - name: Operational risk
    detail: Estimates the impact on the system, likely downtime and safety.
  - name: Decision and coordination
    detail: >-
      Proposes mitigation steps with timelines, flags the ones that need human approval, and
      consolidates everything into one update pushed to the dashboard.
decisions:
  - title: Simulated data instead of hardware
    why: >-
      A generator produces SWaT-style sensor data with controlled attack scenarios, so the whole
      pipeline can be demonstrated without access to a real plant or testbed.
  - title: Agents with one job each
    why: >-
      Detection, risk and response are separate agents, so each stage can be read, tested and
      replaced on its own, and the dashboard can show why a decision was made, not only what it was.
  - title: Push, not poll
    why: >-
      The backend streams each processed batch to the dashboard over Socket.IO, so the operator
      view stays real-time without the browser polling.
numbers:
  - value: 99.83%
    label: Classification accuracy
    note: >-
      On simulated sensor data modelled on the SWaT testbed, 80/20 stratified split. Not evaluated on
      the real iTrust SWaT dataset.
  - value: 0.98 / 0.99
    label: Precision / recall
    note: F1 0.98, same split.
  - value: '51'
    label: Sensor features
  - value: '6'
    label: Agents in the chain
stack:
  - pandas
  - Flask-SocketIO
  - Recharts
  - Docker
  - nginx
status: >-
  An academic project. Next steps would be the real SWaT dataset, authentication, alerting and a
  retraining pipeline.
sources:
  - label: Source code
    href: https://github.com/Ayushjo/ics-minor
---

This was a college project, and the numbers need their conditions attached. The 99.83% accuracy is
on data generated to resemble the SWaT testbed, with attack scenarios written into the generator.
It shows that the pipeline works end to end. It doesn't show how the classifier would do against a
real plant or the real SWaT recordings, which is the obvious next test.

The part I'd keep is the shape of the system. Each batch of readings goes through a chain of agents
that each answer one question: what happened, how dangerous is it to the plant's security, how
dangerous is it to its operation, and what should be done. The final agent marks which actions
need a human to approve them before anything changes in the plant.
