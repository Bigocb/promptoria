
| Day | Topics | Theory | Lab / Activity | Homework |
|-----|--------|--------|----------------|----------|
| Mon | REST fundamentals, HTTP verbs, status codes, authentication (JWT, OAuth) | 45 | Use Postman to send GET/POST requests to a public API (e.g., JSONPlaceholder) | Document 5 endpoints with cURL examples |
| Tue | Postman collections, environments, pre‑request & test scripts (JS) | 40 | Build a collection for the “Online Bookstore” API (CRUD) | Add a test that validates JSON schema |
| Wed | Introduction to contract testing – **Pact** (consumer‑driven) | 45 | Create a consumer contract using Pact JVM (Java) or Pact JS | Run the contract verification against a mock provider |
| Thu | Mock servers (WireMock, Mockoon) & service virtualization | 30 | Spin up a WireMock stub for a payment gateway API | Write a test that verifies failure handling when gateway returns 502 |
| Fri | API test reporting (JUnit XML, Allure) & CI integration | 35 | Add API test stage to GitHub Actions pipeline; publish Allure report | Review the pipeline run and fix any flaky tests |
| **Weekend Challenge** | *API Hackathon*: Design and document a **new** endpoint (e.g., “apply discount”) and create contract + Postman tests for it | — | — | Submit a PR with swagger/openapi spec, contract, and collection |

### Week 6 – Performance & Security Basics

| Day | Topics | Theory | Lab / Activity | Homework |
|-----|--------|--------|----------------|----------|
| Mon | Load vs. stress vs. soak testing, key metrics (TPS, latency, error %), JMeter architecture | 45 | Install JMeter, record a simple HTTP test plan (search) | Add a **Think Time** and run a 1‑minute test |
| Tue | Building parameterised tests, CSV data set, assertions on response time | 35 | Add assertions for < 2 s response, run distributed test with 2 JMeter slaves (Docker) | Generate a basic HTML report |
| Wed | Intro to **k6** (JavaScript) – scriptable load testing | 40 | Write k6 test for the same endpoint, run in cloud (k6.io) free tier | Compare JMeter vs. k6 resource usage |
| Thu | Basics of web‑application security, OWASP Top 10, scanning tools | 45 | Run OWASP ZAP scan against the demo app, analyse findings | Mitigate at least one low‑severity issue (e.g., missing security headers) |
| Fri | Performance test result analysis, bottleneck identification | 30 | Use JMeter Listener/ Grafana dashboard to visualise latency distribution | Write a short “Performance Findings” report (max 500 words) |
| **Weekend Challenge** | *Performance Sprint*: Simulate 100 virtual users on the checkout flow, capture response times, and propose two optimisation recommendations | — | — | Submit the JMeter/k6 scripts and the recommendations in a markdown file |

### Week 7 – CI/CD, Test Data Management & Cloud Labs

| Day | Topics | Theory | Lab / Activity | Homework |
|-----|--------|--------|----------------|----------|
| Mon | CI fundamentals, GitHub Actions vs. Azure Pipelines vs. Jenkins | 35 | Create a simple CI workflow that lints, builds & runs unit tests | Add a badge to README showing CI status |
| Tue | Adding UI & API test stages, artifact publishing, parallel jobs | 45 | Extend the pipeline from Week 5 to run Cypress + API tests | Introduce **flaky‑test detection** (e.g., retry on failure) |
| Wed | Test data management – synthetic data, CSV/DB fixtures, masking | 40 | Use **Faker** library to generate 200 user records and load into an in‑memory H2 DB | Write a data‑setup script that runs before tests |
| Thu | Cloud‑based cross‑browser labs (BrowserStack, Sauce Labs) | 30 | Configure a Selenium test to run on BrowserStack via remote WebDriver | Capture screenshots for 3 browsers and attach to a test report |
| Fri | Versioning of test assets, branching strategy for QA (feature‑branch, release‑branch) | 30 | Simulate a PR that adds a new test case; run CI and observe effect on the release branch | Document the **QA branching model** in a markdown file |
| **Weekend Challenge** | *CI/CD Marathon*: Build a full pipeline that includes **code lint → unit → UI → API → performance → security** and pushes results to a Slack channel (use webhook). | — | — | Record a short video (≤ 3 min) demonstrating the pipeline run end‑to‑end |

### Week 8 – Emerging & “Bleeding‑Edge” Practices

| Day | Topics | Theory | Lab / Activity | Homework |
|-----|--------|--------|----------------|----------|
| Mon | AI‑assisted test generation – **Testim.io**, **Mabl**, **ChatGPT‑based script writing** | 40 | Use Testim’s free tier to record a flow and let AI suggest assertions | Compare AI‑generated script size vs. hand‑written |
| Tue | Visual regression testing – **Applitools Eyes**, **Playwright screenshot comparison** | 35 | Add visual checkpoints to the “Todo” app, run in CI | Generate a visual diff report and interpret failures |
| Wed | Contract testing beyond HTTP – **GraphQL**, **gRPC** basics | 45 | Create a simple GraphQL query test using **Apollo** client | Write a contract test for a GraphQL schema |
| Thu | Chaos Engineering – **Gremlin**, **Chaos Mesh**, **Simian Army** concepts | 30 | Introduce latency fault to the API with **Toxiproxy**, observe test resilience | Draft a **Chaos experiment** plan (max 300 words) |
| Fri | Test strategy evolution – shift‑left, shift‑right, observability, SRE partnership | 30 | Group discussion: Building an **End‑to‑End observability‑driven testing** model | Write a one‑page “Future QA Roadmap” for your organization |
| **Weekend Challenge** | *Innovation Sprint*: Pick **any** emerging tool covered this week, build a proof‑of‑concept test and present it (slide deck + demo) | — | — | Submit deck and video link (max 5 min) |

---  

## Capstone Project (Days 57‑60)

**Scenario:** *A fictional e‑commerce platform (“ShopSphere”) is being released for a public beta.*

**Goal:** Produce a **complete QA artefact set** and a **fully automated CI pipeline** that the product team can hand over to the next development cycle.

| Artefact | Description | Required Tools |
|----------|-------------|----------------|
| **Test Strategy Document** | Scope, testing levels, risk analysis, resources, entry/exit criteria | Markdown/Word |
| **Test Plan** | Schedule, environment matrix, responsibilities | TestRail (template) |
| **Manual Test Cases** | 20‑30 test cases covering core flows (login, product search, checkout, order cancel) | TestRail |
| **Automated UI Suite** | End‑to‑end Cypress (or Selenium) covering same flows, with visual checkpoints | Cypress + Allure |
| **API Contract Tests** | Pact contract for “Payments” micro‑service, Postman collection for order API | Pact, Postman |
| **Performance Test** | k6 script simulating 200 VUs on checkout endpoint | k6 |
| **Security Scan** | OWASP ZAP baseline scan of the web app | ZAP |
| **CI/CD Pipeline** | GitHub Actions workflow that runs all above, posts results to Slack & GitHub checks | GitHub Actions |
| **Presentation** | 10‑minute live demo + Q&A | PowerPoint / Google Slides |

**Assessment rubric** (total 100 pts)

| Category | Weight |
|----------|--------|
| Completeness of artefacts | 30 |
| Quality & readability of documentation | 15 |
| Test coverage & reliability (no flaky tests) | 20 |
| CI pipeline correctness & reporting | 15 |
| Innovation (use of emerging tech) | 10 |
| Presentation & communication | 10 |

*Minimum passing score:* **80 pts**.

---  

## Evaluation & Certification

| Evaluation Method | Timing | Weight |
|-------------------|--------|--------|
| Weekly quizzes (10 min each) | End of each week | 10 % |
| Lab assignments (auto‑graded) | Ongoing | 30 % |
| Peer code‑review score | Weekly | 10 % |
| Mid‑program practical exam (Week 4) | Day 25 | 10 % |
| Capstone project (artefacts + demo) | Days 57‑60 | 40 % |

**Certificate of Completion** – Issued on successful fulfilment (≥ 80 % overall, no pending labs). The certificate includes a **digital badge** (Open Badges format) that can be added to LinkedIn/Resume.

---  

## Resources & Reference Material

| Category | Resource | Link |
|----------|----------|------|
| **Books** | *Testing Computer Software* – Cem Kaner (2nd ed.) | https://www.goodreads.com/book/show/123692.Testing_Computer_Software |
| | *Clean Code* – Robert C. Martin (for automation) | https://www.oreilly.com/library/view/clean-code/9780136083238/ |
| | *Continuous Delivery* – Jez Humble & David Farley | https://www.goodreads.com/book/show/10127057-continuous-delivery |
| **Online Courses** | “ISTQB Foundation Level” – Udemy (free trial) | https://www.udemy.com/course/istqb-foundation/ |
| | “Selenium WebDriver with Java” – Test Automation University | https://testautomationu.applitools.com/selenium-webdriver-tutorial-java/ |
| | “Cypress Basics” – Cypress.io Docs | https://docs.cypress.io/guides/overview/why-cypress |
| | “API Testing with Postman” – Postman Learning Center | https://learning.postman.com/docs/getting-started/introduction/ |
| **Tools (all free/community)** | Selenium, Cypress, Playwright, JMeter, k6, Postman, Pact, Allure, GitHub Actions, Docker, WireMock, Faker, Applitools (free tier), Testim (free tier), OWASP ZAP | N/A |
| **Cheat‑Sheets** | “Selenium Locators” – Guru99 | https://www.guru99.com/selenium-tutorial.html |
| | “Cypress Commands” – Cypress Docs | https://docs.cypress.io/api/table-of-contents |
| **Communities** | Ministry of Testing (forums, webinars) | https://www.ministryoftesting.com/ |
| | Reddit r/QualityAssurance | https://www.reddit.com/r/QualityAssurance/ |
| | Stack Overflow – [qa] tag | https://stackoverflow.com/questions/tagged/qa |

All links are pre‑populated in the repo's `resources.md` file.

---  

## Mentorship & Support

| Support Channel | Frequency | Owner |
|----------------|-----------|-------|
| **Daily stand‑up (15 min)** – Quick sync on progress, blockers, plan for the day | Mon‑Fri | Lead QA Mentor |
| **Office Hours** (1 h) – Open Q&A, code review, tool help | Tue & Thu | Senior QA Engineer |
| **Slack Workspace** – #general, #qa‑questions, #automation‑help, #capstone‑review | 24/7 | All mentors + peers |
| **Weekly Retrospective** (30 min) – What went well, what to improve | Friday afternoon | All participants |
| **One‑on‑One Check‑in** (30 min) – Mid‑program & final review | Week 4 & Week 8 | Assigned Mentor |

---  

## Tips for Success

1. **Read the test case before you code it.** Understanding the requirement fully eliminates re‑work.
2. **Commit early, commit often.** Small PRs are easier to review and keep the CI pipeline green.
3. **Write deterministic tests.** Use explicit waits, clean test data, and reset state between runs.
4. **Treat failures as learning.** Capture logs/screenshots, add them to the defect, and ask *why* the test failed.
5. **Leverage the community.** Search StackOverflow or the tool’s GitHub issues before raising a new question.
6. **Document everything.** A well‑named test, clear comments, and a concise README save weeks of future debugging.
7. **Experiment.** The weekend challenges are optional but are the fastest way to master a new tool.
8. **Think like a developer.** Understand the code under test – read the API spec, look at the UI markup, run the app locally.

---  

### 🎉 Ready to start?

1. Clone the repo: `git clone https://github.com/qa-bootcamp/60-day-program.git`
2. Follow the **Day 1 checklist** in `week1/README.md`.
3. Join the Slack workspace (invite sent to your email).

*Happy testing!* 🚀  