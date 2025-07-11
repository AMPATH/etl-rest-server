var db = require('../../etl-db');

export class HTSModuleService {
  getHTSSummary = (patientUuid) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
      USE amrs;
      
      WITH combined_data AS (
    SELECT 
        p.uuid AS patient_uuid,
        p.person_id,
        e.encounter_datetime,
        cn_last_test.name AS last_test_result,
        cn_strategy.name AS testing_strategy,
        cn_client.name AS client_type,
        cn_entry.name AS entry_point,
        CASE WHEN cn_consent.name = 'YES' THEN 'Yes' ELSE 'No' END AS consent_given,
        CONCAT(pn_provider.given_name, ' ', pn_provider.family_name) AS provider,
        cn_rapid.name AS rapid_antibody,
        
        ROW_NUMBER() OVER (
            PARTITION BY p.person_id
            ORDER BY 
                CASE WHEN o_last_test.obs_id IS NOT NULL THEN 0 ELSE 1 END,
                e.encounter_datetime DESC
        ) AS rn_test_result,
        
        ROW_NUMBER() OVER (
            PARTITION BY p.person_id
            ORDER BY 
                CASE WHEN o_strategy.obs_id IS NOT NULL THEN 0 ELSE 1 END,
                e.encounter_datetime DESC
        ) AS rn_strategy,
        
        ROW_NUMBER() OVER (
            PARTITION BY p.person_id
            ORDER BY 
                CASE WHEN o_client.obs_id IS NOT NULL THEN 0 ELSE 1 END,
                e.encounter_datetime DESC
        ) AS rn_client,
        
        ROW_NUMBER() OVER (
            PARTITION BY p.person_id
            ORDER BY 
                CASE WHEN o_consent.obs_id IS NOT NULL THEN 0 ELSE 1 END,
                e.encounter_datetime DESC
        ) AS rn_consent,
        
        ROW_NUMBER() OVER (
            PARTITION BY p.person_id
            ORDER BY 
                CASE WHEN o_entry.obs_id IS NOT NULL THEN 0 ELSE 1 END,
                e.encounter_datetime DESC
        ) AS rn_entry,
        ROW_NUMBER() OVER (
            PARTITION BY p.person_id
            ORDER BY 
                CASE WHEN o_rapid.obs_id IS NOT NULL THEN 0 ELSE 1 END,
                e.encounter_datetime DESC
        ) AS rn_rapid

    FROM person p
    INNER JOIN encounter e 
        ON p.person_id = e.patient_id 
        AND e.voided = 0
        AND e.encounter_type IN (295, 296)
    
    LEFT JOIN obs o_last_test 
        ON e.encounter_id = o_last_test.encounter_id 
        AND o_last_test.voided = 0
        AND o_last_test.concept_id = 1357
    LEFT JOIN concept_name cn_last_test 
        ON o_last_test.value_coded = cn_last_test.concept_id 
        AND cn_last_test.concept_name_type = 'FULLY_SPECIFIED'
        AND cn_last_test.voided = 0
    LEFT JOIN obs o_rapid
        ON e.encounter_id = o_rapid.encounter_id 
        AND o_rapid.voided = 0
        AND o_rapid.concept_id = 2343
    LEFT JOIN concept_name cn_rapid 
        ON o_rapid.value_coded = cn_rapid.concept_id 
        AND cn_rapid.concept_name_type = 'FULLY_SPECIFIED'
        AND cn_rapid.voided = 0
    
    LEFT JOIN obs o_strategy 
        ON e.encounter_id = o_strategy.encounter_id 
        AND o_strategy.voided = 0
        AND o_strategy.concept_id = 10862
    LEFT JOIN concept_name cn_strategy 
        ON o_strategy.value_coded = cn_strategy.concept_id 
        AND cn_strategy.concept_name_type = 'FULLY_SPECIFIED'
        AND cn_strategy.voided = 0
    
    LEFT JOIN obs o_client 
        ON e.encounter_id = o_client.encounter_id 
        AND o_client.voided = 0
        AND o_client.concept_id = 10867
    LEFT JOIN concept_name cn_client 
        ON o_client.value_coded = cn_client.concept_id 
        AND cn_client.concept_name_type = 'FULLY_SPECIFIED'
        AND cn_client.voided = 0
    
    LEFT JOIN obs o_entry 
        ON e.encounter_id = o_entry.encounter_id 
        AND o_entry.voided = 0
        AND o_entry.concept_id = 6749
    LEFT JOIN concept_name cn_entry 
        ON o_entry.value_coded = cn_entry.concept_id 
        AND cn_entry.concept_name_type = 'FULLY_SPECIFIED'
        AND cn_entry.voided = 0
    
    LEFT JOIN obs o_consent 
        ON e.encounter_id = o_consent.encounter_id 
        AND o_consent.voided = 0
        AND o_consent.concept_id = 7656
    LEFT JOIN concept_name cn_consent 
        ON o_consent.value_coded = cn_consent.concept_id 
        AND cn_consent.concept_name_type = 'FULLY_SPECIFIED'
        AND cn_consent.voided = 0
    
    LEFT JOIN encounter_provider ep 
        ON e.encounter_id = ep.encounter_id
    LEFT JOIN provider prov 
        ON ep.provider_id = prov.provider_id
    LEFT JOIN person pr 
        ON prov.person_id = pr.person_id
    LEFT JOIN person_name pn_provider 
        ON pr.person_id = pn_provider.person_id 
        AND pn_provider.voided = 0
    
    WHERE p.uuid = '${patientUuid}'
        AND p.voided = 0
),

prioritized AS (
    SELECT 
        patient_uuid,
        person_id,
        encounter_datetime,
        CASE WHEN rn_test_result = 1 THEN last_test_result END AS last_test_result,
        CASE WHEN rn_strategy = 1 THEN testing_strategy END AS testing_strategy,
        CASE WHEN rn_client = 1 THEN client_type END AS client_type,
        CASE WHEN rn_entry = 1 THEN entry_point END AS entry_point,
        CASE WHEN rn_consent = 1 THEN consent_given END AS consent_given,
         CASE WHEN rn_rapid = 1 THEN rapid_antibody END AS rapid_antibody,
        provider
    FROM combined_data
)

SELECT 
    patient_uuid,
    MAX(last_test_result) AS last_test_result,
    DATE(MAX(encounter_datetime)) AS testing_date,
    MAX(testing_strategy) AS testing_strategy,
    MAX(client_type) AS client_type,
    MAX(entry_point) AS entry_point, 
    MAX(consent_given) AS consent_given,
    MAX(rapid_antibody) AS rapid_antibody,
    MAX(provider) AS provider,
    -- Fixed linkage status logic - calculate after aggregation
    CASE 
        WHEN UPPER(COALESCE(MAX(last_test_result), '')) = 'POSITIVE' THEN
            CASE 
                WHEN EXISTS (
                    SELECT 1
                    FROM encounter e2
                    WHERE e2.patient_id = MAX(person_id)
                      AND e2.voided = 0
                      AND e2.encounter_type = 290
                ) THEN 'Client Linked'
                ELSE 'Client Not Linked'
            END
        ELSE 'Not Applicable'
    END AS linkage_status
FROM prioritized
GROUP BY patient_uuid;
    
    `;

      queryParts = {
        sql: sql
      };

      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };

  getHTSLastEncounterDetails = (patientUuid) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
      USE amrs;
      SELECT 
    p.uuid AS patient_uuid,

    (
        SELECT DATE(MIN(e1.encounter_datetime))
        FROM encounter e1
        WHERE e1.patient_id = p.person_id
          AND e1.encounter_type = 296
          AND e1.voided = 0
    ) AS date_of_initial_hiv_test,

    (
        SELECT DATE(MAX(e2.encounter_datetime))
        FROM encounter e2
        WHERE e2.patient_id = p.person_id
          AND e2.encounter_type = 296
          AND e2.voided = 0
    ) AS date_of_last_hiv_test,

    l.name AS location_name,
    DATE(e.encounter_datetime) AS encounter_date,

    MAX(CASE WHEN o.concept_id = 1040 THEN cn.name END) AS hiv_test_1_results,
    MAX(CASE WHEN o.concept_id = 1326 THEN cn.name END) AS hiv_test_2_results,
    MAX(CASE WHEN o.concept_id = 1357 THEN cn.name END) AS final_results,
    MAX(CASE WHEN o.concept_id = 2343 THEN cn.name END) AS rapid_antibody_result

FROM person p
INNER JOIN encounter e 
    ON p.person_id = e.patient_id 
    AND e.voided = 0
    AND e.encounter_type = 296
    AND e.encounter_datetime = (
        SELECT MAX(e3.encounter_datetime) 
        FROM encounter e3 
        WHERE e3.patient_id = p.person_id 
          AND e3.encounter_type = 296 
          AND e3.voided = 0
    )
INNER JOIN location l 
    ON e.location_id = l.location_id
LEFT JOIN obs o 
    ON e.encounter_id = o.encounter_id 
    AND o.voided = 0
LEFT JOIN concept_name cn 
    ON o.value_coded = cn.concept_id 
    AND cn.concept_name_type = 'FULLY_SPECIFIED'

WHERE p.uuid = '${patientUuid}'
  AND p.voided = 0

GROUP BY p.person_id, p.uuid, e.encounter_id, e.encounter_datetime, l.name;

        `;

      queryParts = {
        sql: sql
      };

      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result);
      });
    });
  };
}
