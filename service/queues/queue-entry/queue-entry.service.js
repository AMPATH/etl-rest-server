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
    qe.patient_id,
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
       WHEN qe.priority = 11666 THEN 'PRIORITY'
       WHEN qe.priority = 12360 THEN 'EMERGENCY'
       WHEN qe.priority = 7316 THEN 'NON-URGENT'
    END AS 'priority',
    v.uuid AS 'visit_uuid',
    qf.name AS 'queue_coming_from',
    cb.bill_status AS 'bill_status',
    cb.bill_item_payment_status,
    cb.price_name AS 'price_name',
    IF(cb.patient_id IS NOT NULL, 1, NULL) AS 'cash_unpaid_client',
    IF(cb.patient_id IS NOT NULL, 1, 0) AS 'hide_in_queue',
    GROUP_CONCAT(DISTINCT contacts.value
        SEPARATOR ', ') AS 'phone_number',
    EXTRACT(YEAR FROM (FROM_DAYS(DATEDIFF(NOW(), p.birthdate)))) AS 'age',
    GROUP_CONCAT(DISTINCT id.identifier
        SEPARATOR ', ') AS 'identifiers'
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
        LEFT JOIN
    amrs.person_attribute contacts ON (p.person_id = contacts.person_id
        AND (contacts.voided IS NULL
        || contacts.voided = 0)
        AND contacts.person_attribute_type_id IN (10 , 48))
        LEFT JOIN
    amrs.patient_identifier id ON (p.person_id = id.patient_id
        AND (id.voided IS NULL || id.voided = 0))
        JOIN
    amrs.visit v ON (v.visit_id = qe.visit_id)
        LEFT JOIN
    amrs.queue qf ON (qe.queue_coming_from = qf.queue_id)
        LEFT JOIN
    (SELECT 
        cb.patient_id,
            cb.status AS 'bill_status',
            bi.payment_status AS 'bill_item_payment_status',
            bi.price_name,
            bi.date_changed AS 'bill_item_updated_at'
    FROM
        amrs.cashier_bill cb
    JOIN amrs.cashier_bill_line_item bi ON (bi.bill_id = cb.bill_id)
    WHERE
        DATE(cb.date_created) = DATE(NOW())
            AND cb.voided = 0
            AND bi.voided = 0
            AND bi.price_name LIKE '%cash%'
            AND bi.payment_status != 'PAID'
    GROUP BY cb.patient_id) cb ON (cb.patient_id = qe.patient_id)
WHERE
    qe.ended_at IS NULL
        AND c.uuid = '${serviceUuid}'
        AND l.uuid = '${locationUuid}'
        AND qe.voided = 0
GROUP BY qe.patient_id , qe.visit_id;`;
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
