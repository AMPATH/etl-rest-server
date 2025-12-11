const db = require('../../../etl-db');

export class ServiceEntry {
  constructor() {}

  getQueueEntriesByLocationAndService(locationUuid, serviceUuid) {
    if (!locationUuid) {
      throw new Error('Location not defined');
    }
    if (!serviceUuid) {
      throw new Error('Service not defined');
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
    q.name,
    qe.queue_entry_id,
    qe.priority_comment,
    TIMESTAMPDIFF(MINUTE,
        qe.started_at,
        NOW()) AS wait_time_in_min,
    qe.uuid AS 'queue_entry_uuid',
    q.uuid AS 'service_uuid',
    q.name AS 'service',
    q.location_id,
    l.name AS 'location',
    q.service,
    q.queue_id,
    qr.name AS 'queue_room',
    qe.priority,
    qe.patient_id,
    qe.visit_id,
    p.uuid AS 'patient_uuid',
    pn.family_name,
    pn.given_name,
    pn.middle_name,
    CASE
        WHEN qe.status = 12362 THEN 'WAITING'
        WHEN qe.status = 12363 THEN 'IN SERVICE'
        WHEN qe.status = 1267 THEN 'COMPLETED'
    END AS 'status',
    CASE
        WHEN qe.priority = 11666 THEN 'NORMAL'
        WHEN qe.priority = 12360 THEN 'EMERGENCY'
    END AS 'priority',
    v.uuid AS 'visit_uuid',
    qf.name AS 'queue_coming_from'
FROM
    amrs.queue_entry qe
        JOIN
    amrs.queue q ON (qe.queue_id = q.queue_id)
        JOIN
    amrs.concept c ON (q.service = c.concept_id)
        LEFT JOIN
    amrs.queue_room qr ON (qr.queue_id = q.queue_id
        AND qr.retired = 0)
        JOIN
    amrs.location l ON (q.location_id = l.location_id)
        JOIN
    amrs.person p ON (p.person_id = qe.patient_id)
        JOIN
    amrs.person_name pn ON (pn.person_id = p.person_id
        AND pn.voided = 0)
        JOIN
    amrs.visit v ON (v.visit_id = qe.visit_id)
        LEFT JOIN
    amrs.queue qf ON (qe.queue_coming_from = qf.queue_id)
WHERE
    qe.ended_at IS NULL
        AND c.uuid = '${serviceUuid}'
        AND l.uuid = '${locationUuid}'
        AND qe.voided = 0
GROUP BY qe.patient_id,qe.visit_id`;
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
