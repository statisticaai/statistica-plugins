# Statistica AI — prompt patterns & best practices

How to phrase `ask_statistica` requests for the best results. The agent works best
with clear, precise prompts — the more specific the goal, the better the output.

## Be specific about the goal

State the domain, deliverable, format, and audience.

- Good: "Write a 2-page equity research note on MSFT with financials, valuation vs
  peers, and key risks. Export as PDF."
- Better: "Write a technically rigorous equity research note on MSFT for a quant PM —
  trailing 5-year fundamental trends, DCF valuation vs SaaS peer multiples, and a
  bull/bear/base scenario table. Export as PDF."

## Specify data parameters

Always define instruments, time range, frequency, benchmarks, and derived metrics.

- Instruments: "AAPL", "SPY", "US 10Y Treasury", "EUR/USD"
- Time range: "last 3 years", "from 2015 to 2020", "since Jan 2024"
- Frequency: "daily", "monthly", "quarterly"
- Benchmarks: "relative to the S&P 500", "vs sector median"
- Derived metrics: "rolling 60-day volatility", "cumulative returns", "drawdowns", "Sharpe"

Example: "Get daily SPY and QQQ returns from 2018 to today, compute rolling 60-day
volatility and max drawdown, and plot both on one chart with recession shading."

## International tickers

Include the exchange suffix to avoid ambiguity: `PETR3.SA` (Petrobras, Brazil),
`ASML.AS` (ASML, Euronext Amsterdam), `7203.T` (Toyota, Tokyo).

## Code & data-science prompts

Describe inputs, method, output, and (if you care) libraries.

Example: "Estimate a Fama-French 3-factor regression for each of the 10 GICS sector
ETFs using 5 years of monthly returns; produce a table of alphas and betas with
t-stats (use statsmodels)."

## Academic / research prompts

Specify rigor and citation style: "methodology section suitable for a finance
journal", "proper LaTeX notation", "search and cite relevant literature",
"Newey-West SE with 4 lags".

## Document generation

Always specify **format** ("as a PDF / Word / Excel / HTML slides"), **structure**
("exec summary, analysis, appendix" / "10 slides with charts"), and **audience**.

Example: "Create a 10-slide PowerPoint on the global macro outlook — one slide per
theme (growth, inflation, policy, rates, equities, credit, FX, commodities) — with
charts and bullet takeaways."

## Tips

- **Iterate within a thread** — pass the returned `thread_id` and refine: "now add a
  drawdown panel below the chart."
- **Be explicit about format** — say "as a table" / "as a chart"; don't assume.
- **Ask for interpretation** — "explain the results" / "interpret the coefficients."
- **Request sources** — "include data sources" / "cite your sources."
- **One call, multi-step** — let one request do the whole job; each call costs a credit.
- **Long jobs** — in Claude Code use `/statistica-ai:research` (background) +
  `/statistica-ai:status` / `/statistica-ai:result` instead of blocking.

## Your own files

Uploading datasets/documents (Data Rooms, chat attachments, Drive/OneDrive
connectors) is a **website-only** feature — not available through the tool. To use
your own data via the plugin, include it inline in the request (small tables/snippets)
or describe where the agent can fetch public data.

# Safety, scope & limitations

- **No investment advice.** Outputs are informational/educational only — not
  personalized investment, tax, or legal advice; the agent does not execute trades.
- **Verify data.** Live feeds may have delays/gaps vs primary systems — confirm
  critical numbers against official sources, especially for compliance/risk.
- **Privacy.** The agent only sees data you provide in the request; follow your
  internal data-sharing and confidentiality policies.
- **Human review.** Like any model it can be incomplete or wrong on edge cases —
  it assists, it doesn't replace expert review or independent verification.
