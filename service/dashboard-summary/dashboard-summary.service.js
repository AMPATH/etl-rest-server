const db = require('../../etl-db');

export class DashboardSummaryService {
  constructor() {}

  getDashboardSummary(locationId) {
    if (!locationId) {
      throw new Error('Location not defined');
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT
    COUNT(*) AS total_opd_visits,
    SUM(CASE 
        WHEN v.date_stopped IS NOT NULL THEN 1 
        ELSE 0 
    END) AS completed_visits,
    SUM(CASE 
        WHEN v.date_stopped IS NULL THEN 1 
        ELSE 0 
    END) AS uncompleted_visits,

   qe_stats.emergencies AS emergencies,
    qe_stats.avg_wait AS average_waiting_minutes

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
