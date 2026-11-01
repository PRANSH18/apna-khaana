# Apna Khaana: Personalised Meals, from Product to Pitch

**Can personalisation turn a cloud kitchen's thin, discount-driven economics into a repeat-order business, and is it fundable?**

This project has two halves: a working product built around a meal-planning agent, and a seed-round investment case for the same business.

**Live app: [apna-khaana.netlify.app](https://apna-khaana.netlify.app/)**

## The investment case

Apna Khaana lets customers configure everyday meals by spice level, oil level, protein, base and nutritional add-ons, while the kitchen process stays standardised. The thesis is that personalisation is the retention engine cloud-kitchen economics depend on.

| | |
|---|---|
| The ask | ₹4 crore seed round at ₹16 crore pre-money, for 20% |
| Traction | 2 kitchens, about 6,000 orders a month, ₹320 average order value, about ₹2.3 crore annualised revenue |
| Unit economics | 18 to 25% contribution margin, still loss-making at EBITDA level |
| The key lever | Retained customers at about 5x LTV/CAC against 1.2 to 1.8x for the blended base |
| Market | Health-customisable urban delivery opportunity of ₹4,600 to 7,500 crore |

The central investment question is whether personalisation lifts repeat behaviour enough to make customer economics scale.

## The product

A Next.js web app for personalised weekly Indian meal subscriptions: public menu, weekly planner, simulated checkout, order history, subscription and account screens, backed by a Supabase schema with row-level security.

At its centre is **Sehat**, a meal-planning agent built to be explainable rather than a black box:

- **Macro fit.** Each goal carries an ideal split of calories across protein, carbs and fat, and every dish is scored on how close its own split sits to that ideal.
- **An adaptive daily budget.** A rich breakfast lowers the lunch and dinner targets, the way a person plans their own day.
- **Learning from swaps.** Each time a customer swaps a dish, small capped signals nudge future plans towards what they keep. These signals never override diet filters or calorie logic.
- **A conversational layer.** Customers ask questions like "how much protein this week?" or "make it higher protein", and every answer traces back to a number on screen.

Sehat is deliberately rules-based. It needs no external AI service, carries no running cost, and makes no medical claims.

## What is in this repository

| Path | What it is |
|---|---|
| [pitch/Apna_Khaana_Pitch_Deck.pdf](pitch/Apna_Khaana_Pitch_Deck.pdf) | 12-slide seed pitch deck |
| [pitch/Apna_Khaana_Investment_Memo.pdf](pitch/Apna_Khaana_Investment_Memo.pdf) | Full pitch document: thesis, market sizing, business model, financial plan, valuation, risks and exit |
| [app/](app/) | Application source: pages, components, the Sehat agent in `lib/`, and the Supabase migration and seed data |

## Run the app locally

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase keys, the app runs in a labelled demo mode so it can be reviewed straight away. Checkout is simulated.

---

PGDM coursework, Great Lakes Institute of Management, Chennai. The pitch was built for Investment Banking and the product for Digital Transformation and Change Management. Team project.
