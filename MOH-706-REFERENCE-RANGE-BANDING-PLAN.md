# MOH 706 — reference-range banding: per-indicator low/high counts

Status: **implemented 2026-10-21, ranges finalised at v1** (B1
`etl.reference_ranges`; B2/B3 base v2.4 + aggregate v2.4; B4 versions locked).
Step 0 Q1/Q2 answered: `amrs.concept_numeric` IS on the replica and populated
for 21/28 in-scope concepts (D1 resolved: curated table, dictionary not read
at request time). **D4 resolved 2026-10-21 (owner: "use international ranges,
adjust later"):** 17 ranges are the dictionary's verbatim; 11 are
international standards (`international v1` source tag) — RBS 3.0–7.8 mmol/L
(random-glucose range; the dictionary's 2.0–5.5 was a fasting range — rig
proof: 6.5 mmol/L bands high under the dictionary value, normal under
international, with no template or rebuild change), AST 0–40 U/L, triglycerides
< 1.7 mmol/L (dictionary row was inverted), OGTT 3.0–7.8, CSF glucose 2.2–4.4,
reticulocyte 0.5–2.5 %, ASOT < 200 IU/mL, PSA ≤ 4.0, CEA < 5.0, CA 19-9 < 37,
AFP < 10 ng/mL. Every value is provisional: adjust by one-row UPDATE on
`etl.reference_ranges` — flags and sums react at request time.
Scope: `etl-rest-server` (`lab-706-base.json`, `lab-706-aggregate.json`) + `etl`
(one seeded lookup table). Cross-reference: the register blank-columns work
lives in `MOH-706-REGISTER-BLANK-COLUMNS-PLAN.md` — this feature is
independent of it and needs **no ETL rebuild**.

## 1. What is being asked

Today the aggregate reports, per numeric indicator, a `total_` count plus
`min_`/`max_` **values** (e.g. `min_blood_sugar = MIN(t1.blood_sugar)`).
There is no "how many results were out of range". The owner wants
**whole-number counts of low and high results per indicator**, e.g.
`blood_sugar_low = 3`, `blood_sugar_high = 7` — 3 results below and 7 above
the reference range for blood sugar — with the ranges taken from a
**global reference** (one dictionary-level range per analyte, the same for
every site), not lab-local ranges.

## 2. Where the ranges can come from (decision D1/D2)

1. **OpenMRS dictionary: `amrs.concept_numeric`** (`low_normal`, `hi_normal`,
   `units`; also low/high \_critical and \_absolute — not used here). This is
   the model's _global_ reference range. **Nothing in the ETL or
   etl-rest-server has ever read this table**, so its presence and — more
   importantly — its **population density** on the analytics replica are
   unverified. An empty or half-populated `low_normal`/`hi_normal` silently
   zeroes the new counts.
2. **A curated `etl.reference_ranges` table** (new, seeded by SQL in the etl
   repo, refreshed like `concept_value_map`): `concept_id` PK, `low_value`,
   `high_value`, `units`, `source` ('MOH 706 reference', 'WHO', …). Works
   regardless of the dictionary; the values are reviewable in one file; the
   report reads it by primary-key probe.
3. **Literals in the template** — how the existing Hb bands (`fbc_hb_*`) and
   the under-5 age splits are done. Zero infrastructure, but then the
   "global reference" lives inside a report template and needs a template
   bump for every range correction.

**Recommendation:** implement 2 as the source of truth, with the seed values
authored from the AMPATH/MOH global reference sheet; if Step 0 shows
`concept_numeric` is present AND well-populated for our analytes, make the
seeded table the _override_ and `concept_numeric` the fallback (or collapse
to `concept_numeric` only — that is decision D2). Either way the base
template reads exactly one resolved pair per concept.

## 3. Indicators in scope (first release)

Every numeric indicator that already has a `total_`/`min_`/`max_` triple in
the aggregate gets a `_low`/`_high` pair, subject to the ranges being
clinically meaningful at a global level:

| Indicator (base slot)                                         | concept                      | Band?                                                                                   | Note                                                                                     |
| ------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| blood_sugar (RBS)                                             | 887                          | yes                                                                                     | the user's example                                                                       |
| ogtt                                                          | 10627                        | yes                                                                                     |                                                                                          |
| creatinine, urea                                              | 790/857                      | yes                                                                                     |                                                                                          |
| total/direct bili, ast, alt, total_protein, alk_phos, albumin | 655/1297/653/654/717/785/848 | yes                                                                                     | LFT/renal panel                                                                          |
| total_cholesterol, triglycerides, ldl                         | 1006/1009/1008               | yes                                                                                     | lipid panel members (1010 head is valueless)                                             |
| t3, t4, tsh                                                   | 7881/7882/7880               | yes                                                                                     |                                                                                          |
| sodium, potassium, chlorides                                  | 1132/1133/1134               | yes                                                                                     | electrolytes — clinically critical bands                                                 |
| proteins (CSF), glucose (CSF)                                 | 6132/6124                    | yes                                                                                     |                                                                                          |
| reticulocyte, asot                                            | 1327/15092                   | yes                                                                                     |                                                                                          |
| psa, cea, ca_19_9, afp                                        | 10249/10250/10251/10570      | cutoffs                                                                                 | tumour markers: `high` only (above cutoff), `low` stays 0/absent                         |
| cd4                                                           | 12078                        | keep existing `cd4_less_than_500`; a `_low` under the global CD4 reference is redundant |
| viral_load                                                    | 856                          | **out of scope**                                                                        | copies/mL has no global "normal range"; suppression thresholds are a different indicator |
| fbc / hgb                                                     | 1019/21                      | keep existing MOH bands                                                                 | `fbc_hb_less_than_5` / `fbc_hb_5_to_10` are register-defined, not reference ranges       |

Panel members double as standalone analyte rows in the flat table; the band
counts follow the same grain the `total_` indicators already use (report
rows), so the existing `*_with_members` ambiguity applies unchanged — record
deltas at validation, no new grain.

## 4. Implementation

### B1 — `etl.reference_ranges` (etl repo)

```sql
CREATE TABLE IF NOT EXISTS etl.reference_ranges (
    concept_id INT PRIMARY KEY,
    low_value  DOUBLE NULL,
    high_value DOUBLE NULL,
    units      VARCHAR(20) NULL,
    source     VARCHAR(50) NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- seed rows authored from the global reference sheet (D2 decides whether
-- concept_numeric supplies/overrides them at read time or at refresh time)
```

New `create_reference_ranges.sql` in `datalake/`; seed values reviewed by the
report owner. No generator/procedure change, no rebuild — the table is
read at request time.

### B2 — Base flags (`lab-706-base.json` → v2.4)

Per in-scope slot, two row flags resolved through the range table (PK probe,
same shape as the existing `fbc_hgb` member probe):

```sql
IF(fbc.concept_id IN (887)
   AND fbc.result_numeric < (SELECT rr.low_value FROM etl.reference_ranges rr
                              WHERE rr.concept_id = 887), 1, 0) AS blood_sugar_low,
IF(fbc.concept_id IN (887)
   AND fbc.result_numeric > (SELECT rr.high_value FROM etl.reference_ranges rr
                              WHERE rr.concept_id = 887), 1, 0) AS blood_sugar_high
```

Boundary convention: **low = strictly `< low_value`, high = strictly `> high_value`, the interval itself inclusive** (a result exactly on a limit is
normal). A NULL bound disables that side (flag 0). `result_numeric IS NOT NULL` is implied by the comparison. If D2 picks `concept_numeric` as
primary, the same probes point there with a `COALESCE` through the seeded
table as override.

### B3 — Aggregate sums (`lab-706-aggregate.json` → v2.4)

`SUM(t1.blood_sugar_low) AS blood_sugar_low`, `SUM(t1.blood_sugar_high) AS blood_sugar_high`, … for every pair. The existing `min_`/`max_`/`total_`
aliases are untouched (historical comparability).

### B4 — Versions

Base 2.3 → 2.4 and aggregate 2.3 → 2.4 **in lockstep** (`uses` entry and
`useTemplateVersion` — a mismatch silently serves the old template; the
patient-list template is unaffected). Frontend: the aggregate indicator list
grows; if MOH 240's indicator picker enumerates aliases explicitly, add the
new pairs there (check `ampath-esm-reports` before release).

## 5. Step 0 — verify before building (analytics replica, read-only)

```sql
-- Q1: is concept_numeric in the replica at all?
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'amrs' AND table_name = 'concept_numeric';

-- Q2: range coverage for the in-scope concepts
SELECT concept_id, low_normal, hi_normal, units
FROM amrs.concept_numeric
WHERE concept_id IN (887,10627,790,857,655,1297,653,654,717,785,848,
                     1006,1009,1008,7881,7882,7880,1132,1133,1134,
                     6132,6124,1327,15092,10249,10250,10251,10570);

-- Q3: sanity — do observed values sit inside the dictionary ranges?
-- (catches mg/dL vs mmol/L mixes and absurd bounds; run per concept)
SELECT fbc.concept_id,
       MIN(fbc.result_numeric) AS obs_min, MAX(fbc.result_numeric) AS obs_max,
       SUM(fbc.result_numeric < cn.low_normal)  AS would_be_low,
       SUM(fbc.result_numeric > cn.hi_normal)   AS would_be_high
FROM etl.flat_moh_706_report fbc
JOIN amrs.concept_numeric cn ON cn.concept_id = fbc.concept_id
WHERE fbc.test_datetime >= '2026-01-01'
GROUP BY fbc.concept_id;
```

Q2 decides D2 (dictionary vs curated seed as primary). Q3's `would_be_*`
percentages that look absurd (>50% low/high) mean wrong units or wrong
ranges — fix the seed before shipping counts.

## 6. Decisions that need a human

| #   | Question                                                                             | Default                                                             |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| D1  | Source of truth for ranges: curated `etl.reference_ranges` vs `amrs.concept_numeric` | Curated table; dictionary merges in at refresh if Q2 shows coverage |
| D2  | If both: which overrides?                                                            | Curated overrides dictionary                                        |
| D3  | Tumour markers: `high`-only (cutoff) or excluded?                                    | `high`-only                                                         |
| D4  | Range values themselves — owner authors/reviews the seed sheet                       | Owner sign-off required before seeding                              |
| D5  | Age/sex-specific ranges (children differ materially for many analytes)               | Out of scope v1 — global per concept; revisit after first release   |

## 7. Risks

- **Sparse/absent `concept_numeric`** → zeroed counts; that is why the
  curated table is the recommended primary.
- **Units mismatch** (results recorded in mg/dL where the range assumes
  mmol/L, or mixed historically) — Q3 exists to catch this per concept.
- **Global ranges flatten age/sex differences** — acceptable for a register
  summary, but the release note must say the counts are against a single
  global reference (D5).
- **Version skew** — base/aggregate/uses must move together (B4).

## 8. Validation

1. Rig: seed `etl.reference_ranges` with a few rows, build the fixture, run
   the base flags via the template-expression runner; assert a low value
   row flags `blood_sugar_low = 1`, in-range rows flag 0 (skill:
   `ampath-etl-test-rig`).
2. `GET /etl/lab-706` — new `*_low`/`*_high` sums are whole numbers; totals
   unchanged: `x_low + x_high <= total_x` for every indicator (strict
   inequality expected — in-range results exist).
3. Regression: all pre-existing aggregate aliases byte-identical for a fixed
   period/location (only additions, no value changes).
