# Statistica AI — full capability map

Everything the Statistica AI agent can do when you delegate to it via
`ask_statistica`. The agent autonomously plans and executes multi-step tasks —
writing and running code, pulling live data, building models, and producing
polished outputs — and returns a written answer plus links to any files it
generates. You never name a tool or skill; just describe what you want.

---

## AI coding and data science

Writes, executes, and debugs code in a sandboxed Python environment with
Jupyter-style execution. Handles the whole workflow — load/clean data, fit
models, produce charts, export results — and fixes its own errors.

- **Python execution** — pandas, numpy, scipy, statsmodels, scikit-learn,
  matplotlib, plotly, seaborn; code + output + charts in one flow.
- **Complete data-science projects** — cleaning, feature engineering, EDA
  (distributions, correlations, outliers); regression/classification/clustering/
  time-series; ML pipelines (CV, tuning, evaluation); backtests, strategy
  prototypes, risk simulations; charts and interactive visualizations.
- **Multi-language code generation** — Python, TypeScript, JavaScript, R, Rust,
  Go, C/C++, Java, etc.; complete packages/libraries/apps, returned for download.

Examples: "Download 5y of SPY, compute rolling 60-day realized vol, plot with
recession shading." · "Build a Fama-French factor pipeline: download factor data,
run regressions for 50 portfolios, produce summary tables."

## Live data feeds — global stocks, futures, FX, crypto, macro

Real-time, not cached.

- **Equities/ETFs/indexes** — real-time & historical prices across US, European,
  Asian, LatAm and other exchanges; intraday OHLCV (split/div adjusted); market
  movers; sector/industry performance.
- **Company fundamentals & analyst intelligence** — income statement, balance
  sheet, cash flow (Q & A); ratios & multiples (margins, leverage, EBITDA, FCF,
  ROE, valuation); earnings transcripts, surprises, estimates, guidance; price
  targets, consensus, up/downgrades; institutional holders, insider trades, float,
  market cap; M&A and corporate events; **stock screening** by many criteria.
- **Futures** — daily/intraday bars, settlement prices, open interest/volume,
  continuous contracts with configurable roll rules.
- **FX, commodities, crypto** — major/EM currency pairs; oil, gold, metals, ags;
  major digital assets.
- **Options & derivatives** — chains (strikes/expiries/pricing), implied-vol term
  structure & surface, Greeks via the math engine.

Ticker format: US tickers directly (`AAPL`); international include the exchange
suffix (`PETR3.SA`, `ASML.AS`, `7203.T`).

## News feeds

Stock/company news, press releases, FX & central-bank commentary, crypto news,
analyst price-target revisions. The agent synthesizes news automatically when
analyzing companies, sectors, or macro themes — no need to ask separately.

## Macroeconomic data feeds

Hundreds of thousands of series across major economies: GDP & real output;
inflation (CPI, PCE, PPI, breakevens); labor (unemployment, payrolls, wages,
participation); interest rates (policy rates, Treasury yields, curve); monetary
aggregates (M1, M2, credit); trade, industrial production, housing, sentiment;
cross-country comparisons.

## Math & computation engine

Exact symbolic/numerical results: option pricing (Black-Scholes, Greeks, IV);
fixed income (duration, convexity, PV, YTM); portfolio math (expected return,
variance, Sharpe, covariance); calculus, algebra, optimization, symbolic
derivations; distributions, moments, hypothesis tests; any quant-finance/econ formula.

## Curated knowledge base

A built-in, auto-searched library of data-science/finance/econometrics reference
material — textbooks, methodology, asset-pricing theory, time-series & causal
methods, code notebooks/templates, and curated research. Grounds technical answers
and methodology guidance automatically.

## Econometrics & statistical modeling

Time series (AR, ARIMA, VAR, VECM, ARDL, cointegration); volatility (ARCH, GARCH,
GJR-GARCH, EGARCH, FIGARCH); panel data (FE, RE, IV); regression families (OLS,
GLM, quantile, mixed effects); risk metrics (VaR, Expected Shortfall, backtests,
stress); diagnostics (ADF, KPSS, structural breaks, residual tests).

## Research & analysis

- **Company / sector / thematic research** — business overviews, financial trends,
  valuation, estimates, risks; peer comp tables; competitive landscape & multi-year
  outlooks.
- **Macro, cross-asset & scenario analysis** — growth/inflation/policy outlooks;
  cross-country comparisons; baseline/upside/downside scenarios with asset-class
  impacts; event studies (FOMC, payrolls, CPI reactions).
- **Daily briefings & event coverage** — structured market summaries; central-bank
  and data-release coverage; company monitoring.
- **Web & academic research** — web search/synthesis; peer-reviewed paper search;
  deep multi-source research notes with citations.

## Document & output generation

Polished, downloadable outputs in every major format: **PDF**, **Word (.docx)**,
**Excel (.xlsx** with formulas**)**, **PowerPoint (.pptx)**, **interactive HTML
dashboards/slides**, **LaTeX** (papers, Beamer), **CSV/data files**, and
publication-quality **charts** (PNG/PDF/SVG), plus AI-generated images. Through the
plugin these come back as text plus file/share links.

---

## Web-platform only (not available through `ask_statistica`)

These are interactive surfaces of the statistica.ai workspace, not reachable from a
single tool call: the **Canvas** long-form editor; **Data Rooms** (persistent
uploaded knowledge bases) and **chat attachments**; **Connectors** (Google
Drive/OneDrive); the **Workflows** template UI; **podcast** and **video/live
streaming**; **voice/email** (Pro); **scheduled tasks** (Pro); **enterprise data
rooms**. The agent's underlying coding and document generation still work via the
tool — but uploading your own files or editing live in a canvas requires the website.
