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
        WHEN qe.ended_at IS NOT NULL THEN 1 
        ELSE 0 
    END) AS completed_visits,

    SUM(CASE 
        WHEN qe.ended_at IS NULL THEN 1 
        ELSE 0 
    END) AS uncompleted_visits,

    SUM(CASE 
        WHEN qe.priority = 12360 THEN 1 
        ELSE 0 
    END) AS emergencies,

    ROUND(
    AVG(
        CASE 
            WHEN qe.ended_at IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, qe.started_at, qe.ended_at)
        END
    )
) AS average_waiting_minutes

FROM amrs.queue_entry qe 
JOIN amrs.queue q ON qe.queue_id = q.queue_id
WHERE 
    qe.voided = 0
    AND q.location_id = ${locationId}              
    AND DATE(qe.started_at) = CURDATE();`;
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
