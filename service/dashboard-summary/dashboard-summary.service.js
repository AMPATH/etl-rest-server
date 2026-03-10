const db = require('../../etl-db');

export class DashboardSummaryService {
  constructor() {}

  getDashboardSummary(locationId) {
    if (!locationId) {
      throw new Error('Location not defined');
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT
    COUNT(DISTINCT v.visit_id) AS total_opd_visits,

    COUNT(DISTINCT CASE 
    WHEN v.date_stopped IS NOT NULL 
    THEN v.visit_id 
    END) AS completed_visits,

    COUNT(DISTINCT CASE 
    WHEN v.date_stopped IS NULL 
    THEN v.visit_id 
    END) AS uncompleted_visits,

   qe_stats.emergencies AS emergencies,
   qe_stats.avg_wait AS average_waiting_minutes,
   lab_stats.total_labs AS labs,
   pharm_stats.total_pharmacy AS pharmacy

FROM amrs.visit v
inner join amrs.encounter e ON e.visit_id = v.visit_id
 LEFT JOIN (
    SELECT
        visit_id,
        SUM(CASE WHEN priority = 12360 THEN 1 ELSE 0 END) AS emergencies,
        CASE 
            WHEN ended_at IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, started_at, ended_at)
        END AS avg_wait
    FROM amrs.queue_entry
    WHERE voided = 0
    GROUP BY visit_id
) qe_stats
    ON qe_stats.visit_id = v.visit_id

/* LABS */
LEFT JOIN (
    SELECT 
        v.location_id,
        DATE(o.date_activated) AS date_created,
        COUNT(DISTINCT o.order_id) AS total_labs
    FROM amrs.orders o
    JOIN amrs.test_order t ON o.order_id = t.order_id
    JOIN amrs.encounter e ON o.encounter_id = e.encounter_id
    JOIN amrs.visit v ON e.visit_id = v.visit_id
    WHERE o.voided = 0
    GROUP BY v.location_id, DATE(o.date_activated)
) lab_stats
ON lab_stats.location_id = v.location_id
AND lab_stats.date_created = CURDATE()

/* PHARMACY */
LEFT JOIN (
    SELECT 
        v.location_id,
        DATE(o.date_activated) AS date_created,
        COUNT(DISTINCT o.order_id) AS total_pharmacy
    FROM amrs.orders o
    JOIN amrs.drug_order d ON o.order_id = d.order_id
    JOIN amrs.encounter e ON o.encounter_id = e.encounter_id
    JOIN amrs.visit v ON e.visit_id = v.visit_id
    WHERE o.voided = 0
    GROUP BY v.location_id, DATE(o.date_activated)
) pharm_stats
ON pharm_stats.location_id = v.location_id
AND pharm_stats.date_created = CURDATE()

WHERE v.voided = 0
  AND v.location_id = ${locationId}
  and e.encounter_type NOT IN (195,264,168,273,274,265,266,267,115)
  AND DATE(v.date_started) = CURDATE();`;
      const queryParts = {
        sql: sql
      };
      db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
}
