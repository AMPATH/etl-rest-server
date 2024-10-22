const db = require('../../etl-db');

const getDefaulterTracingSummary = (locationUuid) => {
  return new Promise((resolve, reject) => {
    const sql = `
    select	
    e.patient_id 'client_id_No',
    d.identifier nupi,
    pn.given_name as first_name, 
    pn.middle_name as middle, 
    pn.family_name as last_name, 
    pa.city_village as village,
    pt.value as 'Telephone number',
    max(if(o.concept_id=1592,(o.value_datetime),null)) as date_of_missed_appointment,
    max(if(o.concept_id=9082,(case o.value_coded 
        when 159 then "Dead" 
        when 12296 then "Return to care" 
        when 10652 then "Transferred" 
        when 1679 then "Stopped" 
        when 9580 then "Follow Up" 
        else "" end),null)) as defaulter_tracing_outcomes,
        max(o.obs_datetime) as 'date of outcomes', 
    max(if(o.concept_id=9467,(o.value_text),null)) as outcomes 
from 
etl.flat_obs fo
	INNER JOIN amrs.encounter e ON fo.encounter_id = e.encounter_id
    inner join amrs.location l on l.location_id=e.location_id
    inner join amrs.person p on p.person_id=e.patient_id and p.voided=0
    inner join amrs.patient_identifier d on d.patient_id=p.person_id
    inner join amrs.person_name pn on pn.person_id = d.patient_id
    inner join amrs.person_address pa on pn.person_id = pa.person_id
    left join amrs.person_attribute pt on pt.person_id = pa.person_id and person_attribute_type_id = 10 and pt.voided =0
    inner join amrs.form f on f.form_id = e.form_id and f.uuid = "f3ba9242-9bbb-4284-a0c0-56ac6f0cec65"
    left join amrs.obs o on o.encounter_id = e.encounter_id 
        and o.concept_id in (1592, 9082, 9467) 
        and o.voided=0
where e.voided=0
    and l.uuid in ('${locationUuid}')
group by e.encounter_id

    `;

    const queryParts = {
      sql: sql
    };
    db.queryServer(queryParts, function (result) {
      result.sql = sql;
      resolve(result);
    });
  });
};

export const getDefaulterTracingData = (locationUuids) => {
  return new Promise((resolve, reject) => {
    getDefaulterTracingSummary(locationUuids)
      .then((results) => {
        const defaulterTracingData = {
          result: {}
        };
        if (results.size) {
          defaulterTracingData.result = results.result || [];
        }
        resolve(defaulterTracingData);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
