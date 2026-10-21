# MOH 706 / MOH 240 laboratory register — blank columns & partial panel results

Status: **plan only, nothing implemented.**
Scope: `etl-rest-server` (retrieval) + `etl` (ETL procedures) + `ampath-esm-reports` (frontend contract).

**Decisions already taken (2026-10-21, report owner):**

- `prior_treatment`, `condition_of_specimen` and `signature` have no concepts yet → **leave them
  blank**. They are not part of this release's scope (D1–D3, RC-5, F4.4a). The register's real
  problem is the other twelve columns.
- D4–D8 remain open (§5).

---

## 1. What the report is today

**Grain.** `etl.flat_moh_706_report` is **one row per lab order** (`amrs.orders.order_id`).
Legacy lab obs that have no order at all are injected as **synthetic rows** with
`report_id = -obs_id` (negative), `order_id = NULL`, `lab_no = NULL`, and
`encounter_id = NULL` when the obs itself has no encounter
(`/media/etl/etl-scripts/stored-procedures/datalake/generate_flat_moh_706.sql`, "Legacy lab obs
with no order at all").

**Retrieval.** `app/reporting-framework/json-reports/lab-706-base.json` (v2.3) reads the flat
table; `lab-706-aggregate.json` (v2.3) sums the per-row indicator flags; `lab-706-patient-list.json`
(v1.1) is the register template that renders the 27 printed columns A–AA. The frontend
(`/media/ampath-esm-reports/src/reports/moh-240/moh-240.columns.ts`) only reads the alias names —
it never needs to change if we keep the aliases.

**Panel results.** `etl.flat_moh_706_report_results` holds one row per `(report_id, analyte)`:
_member_ rows for panels (CBC 1019, URINALYSIS 302, LIPID PANEL 1010) plus one _self_ row per
plain test. `etl.concept_set_map` is the empirical panel→member map (refreshed by
`etl.refresh_concept_set_map()`).

**Screenshots reviewed.**

- `Screenshot From 2026-10-21 08-57-24.png` — columns K–S (Clinical Diagnosis, Prior Treatment,
  Type of Specimen, Condition of Specimen, Investigation Required, Date Sample Collected,
  Date Sample Received, Clinician Name, Date Sample Analysed). Body: only `URINALYSIS` in
  "Investigation Required" and a collected date. Everything else is blank.
- `Screenshot From 2026-10-21 08-57-54.png` — columns T–AA (Date Results Dispatched, Amount
  Charged, Receipt Number, Referrals, Comments, Name of Analysing/Testing Officer, Signature).
  No body values detected.

So: **the register row is being produced (the test, the date, the patient), but the
"operational" columns around it are empty.**

---

## 2. Root causes

### RC-1 — Obs-only (synthetic) rows have no order context, so every order-linked column is NULL

`generate_flat_moh_706.sql` writes for the synthetic rows:
`diagnostic_report_id = NULL, report_date_created = NULL, report_issued = NULL, report_date_changed = NULL, testing_officer = NULL`, and `order_id = NULL`.

`lab-706-patient-list.json` then derives:

| Column                            | Source                                                          | Blank when                        |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------- |
| Date Sample Received              | `fbc.report_date_created`                                       | no FHIR report → NULL             |
| Date Sample Analysed              | `fbc.report_date_changed`                                       | no FHIR report → NULL             |
| Date Results Dispatched           | `fbc.report_issued`                                             | no FHIR report → NULL             |
| Name of Analysing/Testing Officer | `fbc.testing_officer`                                           | no FHIR report → NULL             |
| Amount Charged                    | `SUM(bli.price*bli.quantity) WHERE bli.order_id = fbc.order_id` | `fbc.order_id IS NULL` → no match |
| Receipt Number                    | `b.receipt_number … WHERE bli.order_id = fbc.order_id`          | `fbc.order_id IS NULL` → no match |

**These are the six columns in the second screenshot, and they are blank for exactly the same
reason.** The billing module _does_ have `cashier_bill_line_item.order_id`
(`/media/openmrs-module-billing/api/src/main/resources/Bill.hbm.xml` line 274), so the join is
sound — there is simply no order to join on for these rows.

### RC-2 — Obs-only rows can have NULL `encounter_id`, so every encounter-scoped column is NULL

All of these are joined on `fbc.encounter_id`:

| Column             | Source                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Clinical Diagnosis | `amrs.encounter_diagnosis` (encounter)                                                  |
| Type of Specimen   | `amrs.obs` concept **10338** (encounter)                                                |
| Clinician Name     | `amrs.encounter_provider` → `provider` → `person_name`, fallback `obs` concept **1496** |
| Referrals          | `amrs.obs` concepts **1272 / 1932 / 9552** (encounter)                                  |
| Comments           | `amrs.obs` concept **9467** (encounter) + `fbc.instructions`                            |

An obs with no order _usually_ still has an encounter, so these usually work. But the ETL
explicitly keeps `encounter_id NULL` for encounter-less obs, and the report table allows it.
**Any obs-only row whose obs has no encounter loses six more columns.** That is the first
screenshot: `URINALYSIS` + collected date, nothing else.

Note: for obs-only rows `fbc.instructions` is also NULL (the synthetic insert hard-codes
`instructions = NULL`), so _Comments_ has no order-instruction fallback either.

### RC-3 — The FHIR report link is only reachable through `order_id`

`generate_flat_moh_706.sql`:

```sql
LEFT JOIN amrs.fhir_diagnostic_report f
  ON f.diagnostic_report_id = (
        SELECT MAX(fsr.diagnostic_report_id)
          FROM amrs.fhir_diagnostic_report_service_request fsr
         WHERE fsr.order_id = o.order_id)
```

Two consequences:

1. Obs-only rows can **never** have a FHIR report linked (no order → no `fsr` row) — RC-1.
2. Even for order-backed rows, if `fhir_diagnostic_report_service_request` has no row for that
   order (the FHIR report was created from a different workflow, or the link was never written),
   the received/analysed/dispatched dates are NULL. `MAX(...)` also silently picks _one_ report
   when an order has several.

### RC-4 — `sample_collection_datetime` is taken from obs 10253 only

`test_datetime = COALESCE(sample_collection_datetime, date_activated, encounter_datetime)`.
`sample_collection_datetime` is resolved from obs concept **10253** (SPECIMEN COLLECTION DATE),
order-matched first then encounter-scoped. If 10253 was not recorded, the register shows the
order activation date under "Date Sample Collected" — which looks right but is a different fact.
This is worth surfacing (see R-6) but it is _not_ a blank-column cause.

### RC-5 — `prior_treatment`, `condition_of_specimen`, `signature` have **no source at all**

They are hard-coded `NULL` in `lab-706-patient-list.json` and documented as such in
`create_flat_moh_706.sql`. No amount of SQL fixing will populate them.

**DECIDED (2026-10-21, report owner): leave them blank.** There are no concepts for these
fields yet, so populating them would mean inventing a source. The three aliases stay `NULL` and
the columns render empty. This closes D1/D2/D3 in §5. When the concepts are created, the
columns can be filled in a later release — the ETL/retrieval work in §4 does not need to change
when that happens, only the three expressions in `lab-706-patient-list.json`.

A consequence worth stating plainly: the register will keep showing three empty columns, and
that is the **correct** output, not a defect to be chased. The "blank columns" bug in this
report is the _other_ twelve columns (§2, RC-1…RC-4, RC-6) — those do have sources and are
blank for a fixable reason.

### RC-6 — The Results column shows only analytes that have results

`lab-706-patient-list.json`:

```sql
COALESCE(
  (SELECT GROUP_CONCAT(CONCAT(<member name>, ': ', <value>)
            ORDER BY rr.result_obs_id SEPARATOR '; ')
     FROM etl.flat_moh_706_report_results rr
    WHERE rr.report_id = fbc.report_id
      AND rr.member_concept_id <> fbc.concept_id),
  <the order row's own single value>)
```

`etl.flat_moh_706_report_results` only contains **rows that were actually observed**. Analytes
that were never recorded produce **no row**, so they are simply missing from the string. The
complete panel analyte list lives in `etl.concept_set_map` (panel → member), which the Results
expression does **not** consult.

**This is by design in the ETL** (`moh-706-panel-results-plan.md`: "a panel is 'done' when ≥ 1
member row exists") but it does not match the printed MOH 240 register, which expects the full
panel list. Note also the `ORDER BY rr.result_obs_id` — self-rows have `result_obs_id IS NULL`,
so ordering is by obs lineage, not by panel analyte order; `concept_set_map.sort_weight` is
available for a proper order but is only populated for the handful of rows `amrs.concept_set`
knows.

Two further gaps in the same expression:

- `GROUP_CONCAT` has no `group_concat_max_len` override in the retrieval layer. The default
  `group_concat_max_len` is 1024 bytes. A 23-analyte CBC result string is easily over that →
  **silent truncation** mid-string. (`generate_flat_moh_706.sql` sets
  `group_concat_max_len = 100000` for the ETL, but the API session does not.)
- The `COALESCE` fallback is all-or-nothing: if _any_ member row exists, the order row's own
  value is dropped entirely, so a panel that also has a parent-level coded answer (e.g.
  `fbc.result_concept_id = 703` positive) loses it.

---

## 3. Step 0 — production diagnostics (run first, before any code)

The analytics host is currently unreachable from this environment (`10.50.80.244:3306` closed),
so the hypotheses above are from static analysis of the code paths. **Run the queries below on
the analytics replica to confirm the split before changing anything.** They are read-only.

### 3.1 Classify the register rows

```sql
-- Q1: what share of register rows is order-backed vs synthetic?
SELECT
  CASE WHEN order_id IS NULL THEN 'obs_only_synthetic' ELSE 'order_backed' END AS row_kind,
  COUNT(*) AS rows,
  SUM(encounter_id IS NULL)                 AS null_encounter,
  SUM(lab_no IS NULL)                       AS null_lab_no,
  SUM(diagnostic_report_id IS NULL)         AS no_fhir_report,
  SUM(report_date_created IS NULL)          AS no_received,
  SUM(report_date_changed IS NULL)          AS no_analysed,
  SUM(report_issued IS NULL)                AS no_dispatched,
  SUM(testing_officer IS NULL)              AS no_officer
FROM etl.flat_moh_706_report
WHERE test_datetime BETWEEN '2026-08-01' AND '2026-09-30'
GROUP BY 1;
```

Expected (hypothesis): the `obs_only_synthetic` bucket has `no_*` = 100 %, and a large share of
`null_encounter`. This single query proves RC-1/RC-2.

```sql
-- Q2: order-backed rows that still have no FHIR report (RC-3, unmatched link)
SELECT COUNT(*) AS order_rows_without_fhir_report
FROM etl.flat_moh_706_report r
WHERE r.order_id IS NOT NULL
  AND r.diagnostic_report_id IS NULL
  AND r.test_datetime BETWEEN '2026-08-01' AND '2026-09-30';

-- Q2b: of those, how many DO have a service_request row (link present but join failing)?
SELECT COUNT(*) AS has_service_request
FROM etl.flat_moh_706_report r
JOIN amrs.orders o ON o.order_id = r.order_id
WHERE r.order_id IS NOT NULL
  AND r.diagnostic_report_id IS NULL
  AND EXISTS (SELECT 1 FROM amrs.fhir_diagnostic_report_service_request fsr
               WHERE fsr.order_id = o.order_id);
```

### 3.2 Column-level emptiness

```sql
-- Q3: per-column emptiness on the real register population
SELECT
  COUNT(*) AS total_rows,
  SUM(report_date_created IS NULL) AS received_blank,
  SUM(report_date_changed IS NULL) AS analysed_blank,
  SUM(report_issued        IS NULL) AS dispatched_blank,
  SUM(testing_officer      IS NULL) AS officer_blank,
  SUM(encounter_id         IS NULL) AS encounter_blank,
  SUM(instructions         IS NULL) AS instructions_blank
FROM etl.flat_moh_706_report
WHERE test_datetime BETWEEN '2026-08-01' AND '2026-09-30';
```

### 3.3 Encounter-scoped columns (the encounter_id IS NULL question)

```sql
-- Q4: do the encounter-scoped source obs exist for the affected rows?
SELECT
  COUNT(*) AS rows,
  SUM(ed.n IS NULL) AS no_diagnosis,
  SUM(sp.n IS NULL) AS no_specimen_type,
  SUM(cl.n IS NULL) AS no_clinician,
  SUM(rf.n IS NULL) AS no_referral
FROM etl.flat_moh_706_report r
LEFT JOIN (SELECT encounter_id, COUNT(*) n FROM amrs.encounter_diagnosis WHERE voided=0 GROUP BY encounter_id) ed
       ON ed.encounter_id = r.encounter_id
LEFT JOIN (SELECT encounter_id, COUNT(*) n FROM amrs.obs WHERE voided=0 AND concept_id=10338 GROUP BY encounter_id) sp
       ON sp.encounter_id = r.encounter_id
LEFT JOIN (SELECT encounter_id, COUNT(*) n FROM amrs.encounter_provider GROUP BY encounter_id) cl
       ON cl.encounter_id = r.encounter_id
LEFT JOIN (SELECT encounter_id, COUNT(*) n FROM amrs.obs WHERE voided=0 AND concept_id IN (1272,1932,9552) GROUP BY encounter_id) rf
       ON rf.encounter_id = r.encounter_id
WHERE r.test_datetime BETWEEN '2026-08-01' AND '2026-09-30'
  AND r.encounter_id IS NULL;
```

### 3.4 Billing

```sql
-- Q5: are billing line items linked to lab orders at all?
SELECT
  COUNT(*) AS bill_lines,
  SUM(order_id IS NOT NULL) AS with_order,
  COUNT(DISTINCT order_id) AS distinct_orders
FROM amrs.cashier_bill_line_item
WHERE voided = 0;

-- Q6: for the register's order-backed rows, how many have a bill line?
SELECT
  COUNT(*) AS order_backed_rows,
  SUM(EXISTS (SELECT 1 FROM amrs.cashier_bill_line_item bli
                JOIN amrs.cashier_bill b ON b.bill_id = bli.bill_id
               WHERE bli.order_id = r.order_id
                 AND bli.voided = 0 AND b.voided = 0
                 AND bli.status <> 'CANCELLED')) AS with_bill
FROM etl.flat_moh_706_report r
WHERE r.order_id IS NOT NULL
  AND r.test_datetime BETWEEN '2026-08-01' AND '2026-09-30';
```

If Q5/Q6 show that **no** lab order is ever billed, then `amount_charged`/`receipt_number` need a
different join key (e.g. `encounter_id`/`visit_id` on the bill) — that is a separate design
decision, flagged in §5.

### 3.5 Panels

```sql
-- Q7: how complete are the panel member sets?
SELECT p.concept_id, cn.name,
       COUNT(DISTINCT r.report_id) AS panel_rows,
       AVG(members.n)              AS avg_members_found,
       MAX(members.n)              AS max_members_found
FROM etl.flat_moh_706_report r
JOIN amrs.concept_name cn ON cn.concept_id = r.concept_id AND cn.locale='en' AND cn.voided=0
JOIN (SELECT report_id, COUNT(*) n FROM etl.flat_moh_706_report_results GROUP BY report_id) members
  ON members.report_id = r.report_id
WHERE r.concept_id IN (302, 1010, 1019)
GROUP BY 1, 2;

-- Q8: the full member universe per panel (the list the register should print)
SELECT cs.concept_id AS panel, cs.concept_set AS analyte, cn.name AS analyte_name, cs.sort_weight
FROM etl.concept_set_map cs
LEFT JOIN amrs.concept_name cn ON cn.concept_id = cs.concept_set AND cn.locale='en' AND cn.voided=0
ORDER BY cs.concept_id, cs.sort_weight, cs.concept_set;
```

Q8 is the authoritative analyte list for the Results fix (§4.4).

### 3.6 The screenshot rows specifically

The screenshot shows URINALYSIS rows dated 13/08/2026 … 28/08/2026. Find them and dump every
derived column, so the plan can be checked against the exact rows the user reported:

```sql
SELECT r.report_id, r.order_id, r.lab_no, r.encounter_id, r.concept_id,
       r.test_datetime, r.diagnostic_report_id, r.report_date_created,
       r.report_date_changed, r.report_issued, r.testing_officer, r.instructions
FROM etl.flat_moh_706_report r
WHERE r.concept_id = 302
  AND r.test_datetime BETWEEN '2026-08-10' AND '2026-09-01'
ORDER BY r.test_datetime;
```

---

## 4. The fixes

Ordered by dependency. **F1–F3 are the ETL; F4–F6 are retrieval; F7 is the frontend contract
(no change expected).**

### F1 — Preserve `encounter_id` and `order_id` context for obs-only rows (ETL, RC-1/RC-2)

**Problem.** A synthetic row has `order_id = NULL` and sometimes `encounter_id = NULL`, which
kills six order-linked columns and (when the encounter is missing) six more.

**Fix (a) — recover an order for the obs-only row.** In the "Legacy lab obs with no order at
all" branch of `generate_flat_moh_706.sql`, the `NOT EXISTS` guard currently excludes any obs
whose `(patient_id, concept_id)` matches a non-voided order (with a matching encounter). But that
guard compares only _concept + encounter_. An obs for the same concept on the same encounter as a
_different_ order is wrongly excluded — and, more importantly, an obs with **no** order but whose
encounter **does** have orders is dropped entirely.

Change the synthetic-row insert so that, instead of `order_id = NULL`, it **adopts the best
matching order**:

```sql
-- in the obs-only branch, replace the hard NULL with a correlated pick:
IFNULL(
  (SELECT o2.order_id
     FROM amrs.orders o2
    WHERE o2.patient_id  = x.person_id
      AND o2.voided      = 0
      AND o2.encounter_id = x.encounter_id
      AND o2.concept_id  = x.concept_id
    ORDER BY o2.date_activated DESC, o2.order_id DESC
    LIMIT 1),
  (SELECT o3.order_id
     FROM amrs.orders o3
    WHERE o3.patient_id  = x.person_id
      AND o3.voided      = 0
      AND o3.concept_id  = x.concept_id
    ORDER BY o3.date_activated DESC, o3.order_id DESC
    LIMIT 1)
) AS adopted_order_id
```

`report_id` must then stay unique. Options: keep `report_id = -obs_id` and add
`order_id = adopted_order_id`; or `report_id = adopted_order_id` and drop the synthetic row
entirely (cleanest, but changes the grain and the counts — **needs sign-off**, see §7). The
recommended first step is the **additive** variant: keep `report_id = -obs_id`, set
`order_id = adopted_order_id`, and populate the FHIR/billing columns from that order.

> **Sign-off required.** Adopting an order changes what `fbc.order_id` means for these rows and
> therefore what `amount_charged` / `receipt_number` attribute to them. Because a synthetic row
> and its adopted order may coexist, the register could double-count a charge. The retrieval fix
> in F5 must therefore aggregate the _whole encounter's_ orders for billing (see F5), which
> sidesteps the double-count.

**Fix (b) — keep the encounter when the obs has one but the order does not.** Already the case
(`x.encounter_id` is carried through). The gap is only for genuinely encounter-less obs, for
which there is nothing to derive. Nothing to do beyond documenting it.

**Fix (c) — fill the FHIR columns for synthetic rows.** After adopting an order, join
`amrs.fhir_diagnostic_report` through
`amrs.fhir_diagnostic_report_service_request.order_id = adopted_order_id` exactly as the
order-backed branch does, and derive `testing_officer` the same way. This alone populates
**Date Sample Received, Date Sample Analysed, Date Results Dispatched, Name of Analysing/Testing
Officer** for the adopted rows.

**Fix (d) — carry the order's `instructions` onto the synthetic row** instead of hard-coding
`NULL`, so Comments has an order-instruction fallback for these rows too.

**Files.** `/media/etl/etl-scripts/stored-procedures/datalake/generate_flat_moh_706.sql`
(obs-only branch), and the procedure version string must be bumped (`v3.1` → `v3.2`) so the
watermark re-queues correctly — but note the **build-first migration guard**: a fresh v3.1
install must run `build` once before `sync` is allowed. A version bump alone will not rebuild the
historical rows, so **a full `build` is required** for F1 to take effect on the 14 092-person
queue.

### F2 — Make the FHIR report resolution robust (ETL, RC-3)

Three changes in the same procedure:

1. **Fall back to the encounter.** When no `fsr` row matches the order, look for a
   `fhir_diagnostic_report` whose `subject`/encounter matches the order's encounter, or whose
   `issued` date falls on the order's encounter date. (Column names must be confirmed against the
   actual `amrs.fhir_diagnostic_report` extract — the ETL currently only uses
   `diagnostic_report_id`, `date_created`, `issued`, `date_changed`.)
2. **Keep the report row, not just the latest.** Instead of `MAX(fsr.diagnostic_report_id)`, pick
   the report by a deterministic rule (`ORDER BY f.issued DESC, f.diagnostic_report_id DESC`) and
   store the chosen `diagnostic_report_id`.
3. **Do not lose `issued` to `date_changed` semantics.** `report_date_changed` is used for "Date
   Sample Analysed" and `report_issued` for "Date Results Dispatched". `date_changed` on the FHIR
   report is also bumped by _any_ later edit to the report, so "analysed" drifts. Prefer a
   dedicated stamp if the extract has one; otherwise document the semantics.

### F3 — Complete the panel member capture (ETL, RC-6 prerequisite)

The Results fix (F4.4) needs the member universe from `etl.concept_set_map`, but the _values_
come from `etl.flat_moh_706_report_results`, which only holds observed rows. Two ETL gaps to
close first:

1. **Path U is over-gated.** In `generate_flat_moh_706.sql`, Path U (ungrouped encounter-level
   analytes) only fires when `t.anchor_obs_id IS NULL` **and** `t.encounter_id IS NOT NULL`.
   For an obs-only synthetic row the anchor is its own obs id, so Path U never fires for it, and
   the lipid-panel recording pattern (ungrouped 1006–1009) is only captured for order-backed
   rows. Relax the gate to: "no group head **and** (order-backed **or** obs-only)", and drop the
   `encounter_id IS NOT NULL` requirement when an `order_id` is available.
2. **Member obs that are themselves obs-only register rows** are currently also captured as
   members of the panel row (additive). That is fine for display, but the anti-overlap guard
   described in `moh-706-panel-results-plan.md` ("never let one obs surface under two report
   rows") is **not** implemented in the current SQL — Path G and Path U are separate `INSERT IGNORE`s into a PK of `(report_id, member_concept_id)`, so the _same obs_ can appear under two
   _different_ report ids. Add the guard.

Also: `refresh_concept_set_map()` is empirical and only covers panels **302, 1010, 1019**. If
Q8 shows a panel is missing members (e.g. a member analyte that was never observed under a head),
the map needs a dictionary fallback. `amrs.concept_set` is materially incomplete (4 rows), so
the empirical map is the right primary source — but the scope list must be widened to whatever
panels the reportable concept list actually contains.

### F4 — Retrieval-layer fixes (`app/reporting-framework/json-reports/lab-706-patient-list.json`)

**F4.1 — Never lose the parent value.** Change the Results expression from
`COALESCE(members, own_value)` to `CONCAT_WS('; ', members, own_value_when_distinct)`, so a
panel keeps both its analytes and any parent-level coded result.

**F4.2 — Full-panel Results.** Rewrite the Results expression to drive off
`etl.concept_set_map`, so an analyte with no result is still printed:

```sql
-- for a panel row (concept_id IN (302,1010,1019)):
(SELECT GROUP_CONCAT(
          CONCAT(cvt_m.name, ': ',
                 COALESCE(rr.result_concept_id IS NOT NULL,
                          cvm_a.name, CAST(rr.result_numeric AS CHAR),
                          TRIM(rr.result_text),
                          DATE_FORMAT(rr.result_datetime,'%Y-%m-%d'),
                          'Not done')   -- or 'Not recorded' — see §6
                 )
          ORDER BY cs.sort_weight, cs.concept_set SEPARATOR '; ')
   FROM etl.concept_set_map cs
   LEFT JOIN amrs.concept_name cvt_m
          ON cvt_m.concept_id = cs.concept_set
         AND cvt_m.locale_preferred = 1 AND cvt_m.voided = 0
   LEFT JOIN etl.flat_moh_706_report_results rr
          ON rr.report_id = fbc.report_id
         AND rr.member_concept_id = cs.concept_set
   LEFT JOIN etl.concept_value_map cvm_a
          ON cvm_a.concept_id = rr.result_concept_id
  WHERE cs.concept_id = fbc.concept_id
    AND cvt_m.name IS NOT NULL)
```

Notes:

- `etl.concept_set_map` is a PK on `(concept_id, concept_set)` → the join is indexed.
- `sort_weight` is NULL for the empirical rows, so the `ORDER BY` must have a stable secondary
  key. Use `ORDER BY cs.sort_weight, cs.concept_set` — but MySQL sorts NULLs first, so all
  empirical members would lead. Either (a) populate `sort_weight` deterministically in
  `refresh_concept_set_map()` (e.g. by the member's position under the head obs, or by concept id
  as a stable proxy), or (b) order by `cvt_m.name`. **Recommendation:** populate `sort_weight` in
  the ETL from the observed member order, and fall back to `concept_id`.
- `amrs.concept_name` **is** present in the analytics replica (used by
  `app/reporting-framework/json-reports/moh-731-2023-patientlist-base.json`,
  `app/reporting-framework/json-reports/claims-summary/claim-summary-patient-list-template.json`
  and `app/moh-registers/registers-mapping.js`), so the analyte names can be read from it. Note
  the join key used elsewhere is `locale_preferred = 1 AND voided = 0` (not `locale = 'en'`), so
  use that.
- The placeholder text for "no result" is a content decision → §6.
- Non-panel rows keep the current single-value behaviour.

**F4.3 — `group_concat_max_len`.** The retrieval layer must raise it. The API opens a
`promise-mysql` pool (`app/database-access/mysql-connection.service.js`), and
`promise-mysql`'s `pool.query()` is a **pool-level** query — each call may land on a different
pooled connection, so a session variable set on one query does **not** carry to the next. The
config has `multipleStatements: true` (all three mysql blocks in `conf/config.json`), so the
simplest correct fix is to **prefix the generated SQL with the session variable** in
`BaseMysqlReport.executeReportQuery` (`app/reporting-framework/base-mysql.report.js` line 3240),
e.g.:

```js
executeReportQuery(sqlQuery) {
  // The pooled connection is not sticky across pool.query() calls, so the
  // session variable has to travel with the statement.
  const query = `SET SESSION group_concat_max_len = 100000; ${sqlQuery}`;
  ...
}
```

Caveat: with `multipleStatements` the driver returns **only the first result set's** rows by
default. `promise-mysql` → `mysql` returns an array of result sets for multi-statements, and
`QueryService.executeQuery` returns it raw — so the shape of `result.results` may change.
**Verify the return shape before adopting this** (the code paths that read
`result.results[0]` would break). The alternative — explicitly acquiring a connection, running
`SET SESSION …` and then the report query on that same connection, then releasing it — keeps the
single-statement shape but needs a small change in `QueryService`/`executeReportQuery`.

Also note `stripPaging()` in `app/routes/lab-706.route.js` strips a trailing
`LIMIT n OFFSET m` from the SQL to build the count query — with a `SET SESSION …;` prefix the
regex still matches (it is anchored at the end), but confirm the count query still executes
correctly.

**F4.4 — `date_results_dispatched` and the other FHIR dates.** Add fallbacks so a NULL FHIR
stamp does not leave the cell empty:

- Received: `COALESCE(fbc.report_date_created, fbc.obs_datetime, fbc.test_datetime)`
- Analysed: `COALESCE(fbc.report_date_changed, fbc.report_date_created, fbc.obs_datetime)`
- Dispatched: `COALESCE(fbc.report_issued, fbc.report_date_changed, fbc.report_date_created)`
  Each fallback is a _different fact_; label them in the column comment / release note so the
  register is not silently misreporting. If the register owner wants blanks rather than derived
  dates, use `NULL` instead — **decide with the owner** (D5, §5).

**F4.4a — `prior_treatment` / `condition_of_specimen` / `signature`: leave as NULL (DECIDED).**
These three expressions stay exactly as they are (`"expression": "NULL"`). **Do not** add a
fallback for them, and do not substitute a related field (e.g. do not put the testing officer's
name under "Signature") — the owner has confirmed there are no concepts for them yet and that
blank is the correct output. Their aliases must keep existing so the register still renders the
27 columns A–AA with the right letter headers.

When the concepts are created later, these three expressions are the only thing that needs to
change; the ETL work in F1–F3 and the rest of F4 are unaffected.

**F4.5 — `clinical_diagnosis` / `type_of_specimen` / `clinician_name` / `referrals` / `comments`
fallbacks for rows with a NULL encounter.** These are keyed on `fbc.encounter_id`. For a row
with no encounter there is nothing to join, but a **person-level** fallback is often meaningful:

- `type_of_specimen` → fall back to the specimen-type obs of the same _person_ within ±1 day of
  `test_datetime` (specimen type is usually recorded on the same visit).
- `clinician_name` → fall back to the encounter provider of the nearest encounter of that person
  on/around `test_datetime`.
- `referrals` / `comments` → same person-level, nearest-encounter fallback.
- `clinical_diagnosis` → nearest-encounter diagnosis fallback.
  This turns "blank" into "best available" but introduces a **correctness risk** (attributing one
  encounter's facts to another). Implement only with the owner's agreement, and mark the fallback
  in the release note. Preferred: fix the _data_ (F1) so the encounter is present, and use these
  only as a safety net for the residual encounter-less rows.

### F5 — `amount_charged` and `receipt_number` (RC-1)

Two changes, both needed:

1. **Order-level → encounter-level aggregation.** Today the charge is `SUM` over the line items
   of `fbc.order_id` only. For a register row that represents one test in an encounter, the
   printed "Amount Charged" is normally the _encounter's_ total. Aggregate over all
   non-voided, non-cancelled line items of the orders **in the same encounter**:

```sql
(SELECT SUM(bli.price * bli.quantity)
   FROM amrs.cashier_bill_line_item bli
   JOIN amrs.cashier_bill b ON b.bill_id = bli.bill_id
   JOIN amrs.orders o ON o.order_id = bli.order_id
  WHERE o.encounter_id = fbc.encounter_id
    AND bli.voided = 0 AND b.voided = 0 AND bli.status <> 'CANCELLED')
```

with the order-level sum kept as the fallback when `encounter_id` is NULL. This also fixes the
double-count risk introduced by F1's order adoption. 2. **A receipt-number fallback that does not need `order_id`**: `amrs.cashier_bill.visit_id` and
`amrs.cashier_bill.patient_id` exist (confirmed in
`/media/etl-rest-server/service/claims-and-billing/claims-and-billing.service.js`). Fall back
to the bill of the row's encounter/visit, then to the patient's most recent bill in the period.

**Verify first:** Q5/Q6 above. If lab orders are never billed, both columns need a different
source entirely and this fix is moot.

### F6 — `testing_officer` fallback (RC-1)

`fbc.testing_officer` comes from `amrs.fhir_diagnostic_report_performers` → `provider` →
`person_name`. For rows with no FHIR report, fall back to the order's creator
(`amrs.orders.creator` → `amrs.users` → person name) or the encounter provider. Also confirm the
extract has `fhir_diagnostic_report_performers` at all — it is used only in the ETL, and
`amrs.fhir_*` appears **nowhere else** in etl-rest-server, which is a signal to verify.

### F7 — Frontend

`moh-240.columns.ts` reads `row.results` and falls back to `row[resultField]`. Alias names in
the patient-list JSON are the contract. **No frontend change is required** as long as:

- the `results` alias keeps its name and stays a single string;
- `lab_no` etc. keep their names;
- the new "no result" placeholder is a plain string (it is).

Optional: if the owner wants the missing analytes visually distinguished (e.g. greyed), the
`results` alias would have to become a structured value — **that would break the frontend
contract** and is out of scope. Keep it a string.

---

## 5. Decisions that need a human (do not guess)

| #   | Question                                                                     | Why it needs a human                            | Status / default                                            |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| D1  | `prior_treatment` — what is it on the printed form?                          | No standard-model source exists                 | **DECIDED 2026-10-21: leave blank.** No concept exists yet. |
| D2  | `condition_of_specimen` — accept/reject/condition?                           | No standard-model source exists                 | **DECIDED 2026-10-21: leave blank.** No concept exists yet. |
| D3  | `signature`                                                                  | A signature is an image/attestation, not a fact | **DECIDED 2026-10-21: leave blank.** No concept exists yet. |
| D4  | Missing panel analytes: show `Not done` / `Not recorded` / hide?             | Printed-form wording                            | `Not done`                                                  |
| D5  | "Date Sample Received/Analysed/Dispatched" fallbacks: derived date or blank? | Misreporting risk                               | Derived, with the source documented                         |
| D6  | Encounter-level fallback for diagnosis/clinician/referrals/comments          | Attribution risk                                | Blank (only fix the data)                                   |
| D7  | `amount_charged`: order-level or encounter-level total?                      | Changes the number                              | Encounter-level, order-level fallback                       |
| D8  | Adopt-order for obs-only rows: keep the synthetic row too, or replace it?    | Row/charge double-count                         | Keep synthetic row, adopt the order id                      |

**D1–D3 are closed.** The three columns have no concepts, so they stay empty by design; the
register owner has confirmed that is the expected output. They need no work in this release.
D4–D8 remain open and still need the owner (or the defaults above, if undecided).

**Do not** let the three blank columns inflate the scope of the release. The register's
"blank columns" problem is the other twelve (RC-1…RC-4, RC-6); those all have sources and are
blank for a fixable reason.

---

## 6. Implementation order

1. **Step 0** — run the §3 queries on the analytics replica; attach the output to this document.
   Confirm or correct RC-1..RC-4. _(No code yet.)_
2. **Decide D4–D8** with the lab-report owner. (D1–D3 are already closed: leave blank.)
3. **F1 + F2** (ETL) → deploy the procedure, run a **full `build`** (not `sync` — the v3.1
   migration guard requires build-first, and the historical obs-only rows are only re-created by a
   build).
4. **F3** (ETL) → same build.
5. **F4.1, F4.2, F4.3, F4.4** (retrieval) → bump `lab-706-patient-list.json` to **v1.2** and
   `lab-706-base.json`/`lab-706-aggregate.json` if the base changes; update the `uses` version
   in `lab-706-aggregate.json` (`"version": "2.3"` must match the base's version) and
   `useTemplateVersion` in the aggregate's `dynamicJsonQueryGenerationDirectives`
   (`"1.1"` → `"1.2"`). **A version mismatch here silently serves the old template.**
6. **F5, F6** (retrieval) → same v1.2 bump.
7. **F7** — verify the frontend renders the new Results string and the new placeholder; no code
   change expected.
8. **Regression** — see §8.

---

## 7. Risks

- **Double counting.** F1 (adopt order) + F5 (encounter-level billing) interact. F5's
  encounter-level aggregation is what keeps the charge from being counted twice.
- **Version skew.** The patient-list template version lives in _two_ places
  (`lab-706-patient-list.json` `version` and `lab-706-aggregate.json`
  `dynamicJsonQueryGenerationDirectives.patientListGenerator.useTemplateVersion`). Both must move
  together; `fetchReportSchema` resolves by name+version.
- **GROUP_CONCAT truncation** (F4.3) is currently silent and will be _worse_ after F4.2 adds the
  missing analytes (a 23-analyte CBC list is long). Fix the session variable in the same release
  as F4.2, never after.
- **Report size / page cost.** F4.2 turns each panel row into a 23-item string; the register page
  is 50 rows. The correlated subquery is a PK probe on `concept_set_map` + `report_results`, so
  it is cheap, but the _response size_ grows. Watch the patient-list latency and the `COUNT(*)`
  subquery in `lab-706.route.js`.
- **Build cost.** A full `build` re-derives 14 092 persons. F1's correlated order lookup runs
  per synthetic row — measure the cycle time on one worker before running the parallel build.
- **`amrs.concept_name` availability** — confirmed present in the replica (see F4.2). Still verify
  the `locale_preferred` join behaves as expected for the ~46 member concepts.
- **The `fbc_hgb` band columns** (`fbc_hb_less_than_5`, `fbc_hb_5_to_10`) read the HGB member
  through `flat_moh_706_report_results`. If F2/F3 changes member capture, those bands move.
  Compare the aggregates before/after.

---

## 8. Validation and regression

**Data-level (ETL)**

1. `SELECT COUNT(*)` on `etl.flat_moh_706_report` before/after — the row count should not change
   (F1 is additive), except where synthetic rows are replaced (D8).
2. The §3 queries re-run: `no_fhir_report`, `null_encounter`, `with_bill` should all fall.
3. Panel completeness (Q7): `avg_members_found` should approach the member universe size (Q8).
4. Spot-check 10–20 CBC / urinalysis / lipid rows end-to-end against the printed lab report.
5. Non-panel aggregates must be **identical** before/after:
   `total_blood_sugar`, `total_creatinine`, `total_ast`, `total_cd4`, `total_hiv`, …

**API-level (retrieval)** 6. `GET /etl/lab-706` — the indicator totals must not move except where the panel/member
counting semantics intentionally change (`*_with_members`); record the deltas. 7. `GET /etl/lab-706/patient-list?indicators=total_urinalysis` — assert that
`date_sample_received`, `date_sample_analysed`, `date_results_dispatched`,
`testing_officer`, `amount_charged`, `receipt_number` are now populated for the rows from the
screenshots, and that `results` contains the **full** panel analyte list. 8. Check the generated SQL for the `GROUP_CONCAT` truncation: the `results` string must end with
the last analyte, not mid-word. 9. `sqlQuery` in the response should show the raised `group_concat_max_len`.
9a. **Assert the three deliberately-blank columns stay blank**: `prior_treatment`,
`condition_of_specimen` and `signature` must be empty/null on every row (D1–D3). They are
blank _by design_, so a non-empty value here means something was wired up that should not
have been.

**Frontend** 10. The register renders 27 columns with no layout regression; the Results cell wraps (it is not
in `MOH_240_WRAP_KEYS` — consider adding it, see below). 11. CSV export: the Results cell is long — confirm the CSV is still usable. 12. The drill-down for a panel indicator shows the panel analytes, not the parent value.

**Suggested small frontend improvement** (optional, separate PR): add `'results'` to
`MOH_240_WRAP_KEYS` in `/media/ampath-esm-reports/src/reports/moh-240/moh-240.columns.ts` so a
23-analyte panel string wraps instead of stretching the row.

---

## 9. File map

| Repo               | File                                                                     | Change                                                      |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| etl                | `etl-scripts/stored-procedures/datalake/generate_flat_moh_706.sql`       | F1, F2, F3                                                  |
| etl                | `etl-scripts/stored-procedures/datalake/create_flat_moh_706.sql`         | DDL comments for the new columns/tables                     |
| etl                | `etl-scripts/stored-procedures/datalake/create_flat_moh_706_results.sql` | `sort_weight` population, wider panel scope                 |
| etl                | `etl-scripts/stored-procedures/datalake/moh-706-panel-results-plan.md`   | update the design/status                                    |
| etl-rest-server    | `app/reporting-framework/json-reports/lab-706-patient-list.json`         | F4, F5, F6 → **v1.2**                                       |
| etl-rest-server    | `app/reporting-framework/json-reports/lab-706-aggregate.json`            | `useTemplateVersion` → `"1.2"`; base version bump if needed |
| etl-rest-server    | `app/reporting-framework/json-reports/lab-706-base.json`                 | only if the base changes (panel flags)                      |
| etl-rest-server    | `app/database-access/query.service.js` / `base-mysql.report.js`          | F4.3 (`group_concat_max_len`)                               |
| ampath-esm-reports | `src/reports/moh-240/moh-240.columns.ts`                                 | optional: wrap `results`                                    |
