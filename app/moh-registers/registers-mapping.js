var db = require('../../etl-db');

var defs = {
  getPrEPRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      let sql = `
            SELECT 
                l.name AS location_name,
                fps.person_id,
                fps.encounter_id,
                pi.identifier AS PrEP_Number,
                pi2.identifier AS National_ID,
                pi3.identifier AS NUPI,
                fps.encounter_datetime AS Date_Of_Visit,
                EXTRACT(YEAR FROM fps.encounter_datetime) - EXTRACT(YEAR FROM fps.birthdate) - CASE
                    WHEN
                        (EXTRACT(MONTH FROM fps.encounter_datetime) < EXTRACT(MONTH FROM fps.birthdate))
                            OR (EXTRACT(MONTH FROM fps.encounter_datetime) = EXTRACT(MONTH FROM fps.birthdate)
                            AND EXTRACT(DAY FROM fps.encounter_datetime) < EXTRACT(DAY FROM fps.birthdate))
                    THEN
                        1
                    ELSE 0
                END Age,
                fps.gender AS Sex,
                CASE
                    WHEN fps.population_type = 1 THEN 'GP'
                    WHEN fps.population_type = 2 THEN 'DC'
                    WHEN fps.population_type = 3 THEN 'MSM/MSW'
                    WHEN fps.population_type = 4 THEN 'FSW'
                    WHEN fps.population_type = 5 THEN 'PWID/PWUD'
                    WHEN fps.population_type = 6 THEN 'VP'
                END AS population_type,
                CASE
                    WHEN fps.encounter_type = 133 THEN 'N'
                    WHEN fps.discontinued_prep = 1 THEN 'D'
                    WHEN
                        fps.discontinued_prep IS NULL
                            AND next_encounter_datetime IS NOT NULL
                            AND fps.encounter_type <> 133
                    THEN
                        'C'
                    WHEN
                        fps.prev_discontinued_prep
                            AND fps.discontinued_prep <> 1
                    THEN
                        'R'
                END AS client_prep_status,
                2 AS prep_method,
                CASE
                    WHEN COALESCE(fps.hiv_rapid_test_result) = 664 THEN 'N'
                    WHEN COALESCE(fps.hiv_rapid_test_result) = 703 THEN 'P'
                END AS HIV_result,
                case when fps.has_sti=1 then 'Y' else 'N' end  AS with_STI,
                COALESCE(fps.initiation_reason,
                        fps.discontinued_reason) AS remarks
            FROM
                etl.flat_prep_summary_v1_1 fps
                    LEFT JOIN
                amrs.location l ON l.location_id = fps.location_id
                    LEFT JOIN
                amrs.patient_identifier pi ON fps.person_id = pi.patient_id
                    AND pi.identifier_type = 44
                    LEFT JOIN
                amrs.patient_identifier pi2 ON fps.person_id = pi2.patient_id
                    AND pi2.identifier_type = 5 
                    LEFT JOIN
                amrs.patient_identifier pi3 ON fps.person_id = pi3.patient_id
                    AND pi3.identifier_type = 45
            WHERE
                DATE(fps.encounter_datetime)= '${params.month}'
                AND l.uuid in (${params.locationUuids})
                order by fps.encounter_datetime desc;
        `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getDefaulterTracingRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select	
            e.patient_id 'client_id_No',
            d.identifier nupi,
            pn.given_name as first_name, 
            pn.middle_name as middle, 
            pn.family_name as last_name, 
            pa.city_village as village,
            pt.value as 'telephone_number',
            max(if(o.concept_id=1592,(o.value_datetime),null)) as date_of_missed_appointment,
            max(if(o.concept_id=9082,(case o.value_coded 
                when 159 then "Dead" 
                when 12296 then "Return to care" 
                when 10652 then "Transferred" 
                when 1679 then "Stopped" 
                when 9580 then "Follow Up" 
                else "" end),null)) as defaulter_tracing_outcomes,
                max(o.obs_datetime) as 'date_of_outcomes', 
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
            and DATE(e.encounter_datetime)= '${params.month}'
            AND l.uuid in (${params.locationUuids})
        group by e.encounter_id
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getHEIRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        SELECT 
            fhi.person_id, 
            fhi.date_enrolled, 
            fhi.birth_date as 'dob', 
            fhi.gender, 
            CONCAT(p.given_name, ' ', p.middle_name, ' ', p.family_name) AS Infant_name, 
            l.name AS Location, 
            pi1.identifier AS Birth_Certificate_number, 
            pi2.identifier AS AMRS_Number, 
            pi3.identifier AS HEI_ID, 
            pi4.identifier AS NUPI, 
            pa.value AS parent_name, 
            pa2.value AS Phone_Number, 
            fhi.initial_hiv_dna_pcr_order_date, 
            FLOOR(DATEDIFF(fhi.initial_hiv_dna_pcr_order_date, fhi.birth_date) / 7) AS age_in_weeks_on_first_pcr,  
            fhi.hiv_dna_pcr_1_date AS first_pcr_date, 
            CASE 
                WHEN COALESCE(fhi.hiv_dna_pcr_resulted, fhi.hiv_dna_pcr_1) = 664 THEN 'N' 
                WHEN COALESCE(fhi.hiv_dna_pcr_resulted, fhi.hiv_dna_pcr_1) = 703 THEN 'P' 
            END AS results_pcr_first_pcr, 
            (EXTRACT(YEAR FROM fhi.hiv_dna_pcr_2_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
            (EXTRACT(MONTH FROM fhi.hiv_dna_pcr_2_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_second_pcr, 
            fhi.hiv_dna_pcr_2_date AS second_pcr_date, 
            CASE 
                WHEN COALESCE(fhi.hiv_dna_pcr_2) = 664 THEN 'N' 
                WHEN COALESCE(fhi.hiv_dna_pcr_2) = 703 THEN 'P' 
            END AS results_pcr_second_pcr, 
            (EXTRACT(YEAR FROM fhi.hiv_dna_pcr_3_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
            (EXTRACT(MONTH FROM fhi.hiv_dna_pcr_3_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_third_pcr, 
            fhi.hiv_dna_pcr_3_date AS third_pcr_date, 
            CASE 
                WHEN COALESCE(fhi.hiv_dna_pcr_3) = 664 THEN 'N' 
                WHEN COALESCE(fhi.hiv_dna_pcr_3) = 703 THEN 'P' 
            END AS results_pcr_third_pcr, 
            (EXTRACT(YEAR FROM fhi.hiv_dna_pcr_4_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
            (EXTRACT(MONTH FROM fhi.hiv_dna_pcr_4_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_confirm_pcr, 
            fhi.hiv_dna_pcr_4_date AS confirm_pcr_date, 
            CASE 
                WHEN COALESCE(fhi.hiv_dna_pcr_4) = 664 THEN 'N' 
                WHEN COALESCE(fhi.hiv_dna_pcr_4) = 703 THEN 'P' 
            END AS results_confirm_pcr, 
            (EXTRACT(YEAR FROM fhi.antibody_screen_1_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
            (EXTRACT(MONTH FROM fhi.antibody_screen_1_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_first_antibody, 
            fhi.antibody_screen_1_date AS first_antibody_date, 
            CASE 
                WHEN COALESCE(fhi.antibody_screen_1) = 664 THEN 'N' 
                WHEN COALESCE(fhi.antibody_screen_1) = 703 THEN 'P' 
            END AS results_first_antibody, 
            (EXTRACT(YEAR FROM fhi.antibody_screen_2_date) - EXTRACT(YEAR FROM fhi.birth_date)) * 12 + 
            (EXTRACT(MONTH FROM fhi.antibody_screen_2_date) - EXTRACT(MONTH FROM fhi.birth_date)) AS age_in_months_on_second_antibody, 
            fhi.antibody_screen_2_date AS second_antibody_date, 
            CASE 
                WHEN fhi.antibody_screen_2 = 664 THEN 'N' 
                WHEN fhi.antibody_screen_2 = 703 THEN 'P' 
            END AS results_second_antibody, 
            CASE 
                WHEN fhi.infant_feeding_method IN (5, 15, 6, 9) THEN 'BF' 
                WHEN fhi.infant_feeding_method IN (17, 8, 3) THEN 'NBF' 
            END AS infant_feeding, 
            CASE 
                WHEN fhi.hei_outcome = 1 THEN 'Infected' 
                WHEN fhi.hei_outcome = 2 THEN 'Uninfected' 
                WHEN fhi.hei_outcome = 3 THEN 'Lost to Follow' 
                WHEN fhi.hei_outcome = 4 THEN 'Transfer Out' 
                WHEN fhi.hei_outcome = 5 THEN 'Dead' 
                WHEN fhi.hei_outcome = 6 THEN 'f' 
            END AS hei_outcome 
        FROM 
            etl.flat_hei_summary fhi 
            LEFT JOIN amrs.person_name p ON p.person_id = fhi.person_id 
            LEFT JOIN amrs.location l ON l.location_id = fhi.location_id 
            LEFT JOIN amrs.patient_identifier pi1 ON pi1.patient_id = fhi.person_id AND pi1.identifier_type = 46 
            LEFT JOIN amrs.patient_identifier pi2 ON pi2.patient_id = fhi.person_id AND pi2.identifier_type = 8 
            LEFT JOIN amrs.patient_identifier pi3 ON pi3.patient_id = fhi.person_id AND pi3.identifier_type = 38 
            LEFT JOIN amrs.patient_identifier pi4 ON pi4.patient_id = fhi.person_id AND pi4.identifier_type = 45 
            LEFT JOIN amrs.person_attribute pa ON pa.person_id = fhi.person_id AND pa.person_attribute_type_id = 12 
            LEFT JOIN amrs.person_attribute pa2 ON pa2.person_id = fhi.person_id AND pa2.person_attribute_type_id = 10 
        WHERE 
            fhi.birth_date >= DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
            and DATE(fhi.encounter_datetime)= '${params.endDate}'
            AND l.uuid in (${params.locationUuids})
        GROUP BY 
            fhi.person_id;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getCNTRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select
            null as serial_number,
            a.encounter_datetime as date,
            a.rtc_date as rtc_date,
            b.identifier as national_id_number,
            c.identifier as NUPI,
            d.identifier as ccc_number,
            timestampdiff(year,
            e.birthdate,
            a.encounter_datetime) as age,
            'Y' as started_on_art,
            case
                when a.tb_screen = 1 THEN 'Y'
                when a.tb_screen = 0 THEN 'N'
            end as screened_for_tb,
            case
                when a.on_ipt = 1 THEN 'Y'
                when a.on_ipt = 0 THEN 'N'
            end as started_on_tpt,
            concat('R', timestampdiff(month, a.encounter_datetime, a.rtc_date)) as current_on_art,
            case
                when f.obs regexp "!!12106=" then etl.getValues(f.obs,
                12106)
                when f.obs regexp "!!12107=" then etl.getValues(f.obs,
                12107)
                else null
            end as 'dsd_status',
            null as dsd_type,
            case
                when f.obs regexp "!!9467=" then etl.getValues(f.obs,
                9467)
                else null
            end as 'remarks'
        from
            etl.flat_hiv_summary_v15b a
        INNER JOIN 
            amrs.location l ON l.location_id = a.location_id
        INNER JOIN
            amrs.patient_identifier b ON
            a.person_id = b.patient_id
            AND b.identifier_type = 5
        INNER JOIN
            amrs.patient_identifier c ON
            a.person_id = c.patient_id
            AND c.identifier_type = 45
        INNER JOIN
            amrs.patient_identifier d ON
            a.person_id = d.patient_id
            AND d.identifier_type = 28
        left join amrs.person e on
            e.person_id = a.person_id
        left join etl.flat_obs f on
            f.encounter_id = a.encounter_id
        where
            a.is_clinical_encounter = 1
            and a.next_clinical_datetime_hiv is null
            and DATE(a.encounter_datetime)= '${params.endDate}'
            AND l.uuid in (${params.locationUuids})
        order by
            a.encounter_datetime desc;
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getANCRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select
            a.encounter_datetime as date_of_visit,
            c.identifier as anc_number,
            d.identifier as NUPI,
            d.identifier as anc_number_NUPI,
            a.visit_num as number_of_anc_visits,
            concat(f.given_name, ' ', f.middle_name, ' ', f.family_name) as full_names,
            b.birthdate as date_of_birth,
            timestampdiff(year,
            b.birthdate,
            a.encounter_datetime) as age,
            e.county_district as subcounty_county,
            e.city_village as village_estate_landmark,
            h.value as phone_number,
            case
                when g.value = 555 THEN 'MARRIED'
                when g.value = 1059 THEN 'WIDOWED'
                when g.value = 1057 THEN 'NEVER MARRIED'
                when g.value = 1175 THEN 'NOT APPLICABLE'
                when g.value = 1056 THEN 'SEPARATED'
            end as marital_status,
            a.parity as parity,
            a.gravidae as gravidae,
            a.last_lmp_date as last_lmp_date,
            a.edd as edd,
            a.gestation_in_weeks as gestation_in_weeks,
            a.mother_muac as muac,
            a.height as height,
            a.weight as weight,
            a.blood_pressure as blood_pressure,
            a.breast_exam as breast_exam,
            a.fgm_done as fgm,
            a.fgm_complications as fgm_complications,
            a.haemoglobin as haemoglobin,
            a.blood_sugar_test as blood_sugar_test,
            a.blood_group_status as blood_group_rhesus,
            a.urinalysis as urinalysis,
            a.duo_test_result as rpr_vdrl_duo,
            a.rpr_test_result as rpr_vdrl_duo_results,
            a.hep_b_screening_result as hepatitisB,
            a.hep_b_screening_tx as hepatitisB_treatment,
            a.tb_screening as tb_screening,
            a.hiv_test_type as hiv_test_type,
            a.hiv_test_1_kit_name as hiv_test_1_kit_name,
            a.hiv_test_1_lot_no as hiv_test_1_lot_no,
            a.hiv_test_1_expiry_date as hiv_test_1_expiry_date,
            a.hiv_test_2_kit_name as hiv_test_2_kit_name,
            a.hiv_test_2_lot_no as hiv_test_2_lot_number,
            a.hiv_test_2_expiry_date as hiv_test_2_expiry_date,
            a.hiv_test_3_kit_name as hiv_test_3_kit_name,
            a.hiv_test_3_lot_no as hiv_test_3_lot_number,
            a.hiv_test_3_expiry_date as hiv_test_3_expiry_date,
            a.hiv_test_3_test_result as hiv_results,
            a.maternal_haart as maternal_haart,
            a.infant_prophylaxis as infant_prophylaxis,
            a.partner_hiv_status as partner_hiv_testing,
            a.other_complications as other_conditions,
            a.other_conditions_tx as other_conditions_treatment,
            a.deworming as deworming,
            a.ipt_dose as ipt_1_3,
            a.tt_dose as tt_dose,
            null as supplementation,
            a.llitns as llitns,
            a.referrals_from as referrals_from,
            a.referrals_to as referrals_to,
            a.reason_for_referral as reason_for_referral,
            a.remarks as remarks
        from 
            etl.flat_mnch_summary a
        left join amrs.person b on
            b.person_id = a.person_id
        left JOIN
            amrs.patient_identifier c ON
            a.person_id = c.patient_id
            AND c.identifier_type = 48
        INNER JOIN
            amrs.patient_identifier d ON
            a.person_id = d.patient_id
            AND d.identifier_type = 45
        left join amrs.location e on
            e.location_id = a.location_id
        left join amrs.person_name f on
            f.person_id = a.person_id
        left join amrs.person_attribute g on
            g.person_id = a.person_id
            AND g.person_attribute_type_id = 5
        left join amrs.person_attribute h on
            h.person_id = a.person_id
            AND h.person_attribute_type_id = 10
        where
            DATE(a.encounter_datetime)= '${params.endDate}'
            AND e.uuid in (${params.locationUuids});
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getPNCRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select
            a.encounter_datetime as date_of_visit,
            b.identifier as pnc_number,
            c.identifier as NUPI,
            c.identifier as pncNumber_or_NUPI,
            concat(d.given_name, ' ', d.middle_name, ' ', d.family_name) as full_names,
            e.birthdate as date_of_birth,
            timestampdiff(year,
            e.birthdate,
            a.encounter_datetime) as age,
            f.county_district as county_subcounty,
            f.city_village as village_estate_landmark,
            g.value as telephone_number,
            a.day_of_delivery as date_of_delivery,
            a.place_of_delivery as place_of_delivery,
            a.mode_of_delivery as mode_of_delivery,
            null as timing_mother,
            null as timing_baby,
            a.temperature as temp,
            a.pulse as pulse,
            a.blood_pressure as blood_pressure,
            a.pallor as pallor,
            null as pallor_type,
            a.breast as breast,
            a.uterus as uterus,
            a.pph as PPH,
            a.c_section_site as c_section_site,
            a.lochia as lochia,
            a.episiotomy as episiotomy,
            a.fistula as fistula,
            a.tb_screening as tb_screening,
            a.tested_pnc as tested_pnc,
            a.hiv_test_1_kit_name as hiv_test_1_kit_name,
            a.hiv_test_1_lot_no as hiv_test_1_lot_no,
            a.hiv_test_1_expiry_date as hiv_test_1_expiry_no,
            a.hiv_test_2_kit_name as hiv_test_2_kit_name,
            a.hiv_test_2_lot_no as hiv_test_2_lot_no,
            a.hiv_test_2_expiry_date as hiv_test_2_expiry_no,
            a.hiv_test_3_kit_name as hiv_test_3_kit_name,
            a.hiv_test_3_lot_no as hiv_test_3_lot_no,
            a.hiv_test_3_expiry_date as hiv_test_3_expiry_no,
            a.pnc_at_6_weeks_or_less as pnc_results_6_weeks_or_less,
            a.pnc_at_more_than_6_weeks as pnc_results_more_than_6_weeks,
            a.infant_prophylaxis_at_6_weeks_or_less as infant_prophylaxis_less_6_weeks,
            a.infant_prophylaxis_at_more_than_6_weeks as infant_prophylaxis_greater_6_weeks,
            a.maternal_haart_at_6_weeks_or_less as maternal_haart_less_6_weeks,
            a.maternal_haart_at_more_than_6_weeks as maternal_haart_greater_6_weeks,
            a.cervical_cancer_method as cacx_method,
            a.cervical_cancer_result as cacx_results,
            a.ppfp_done as PPFP,
            a.ppfp_method as PPFP_couselled_method_received,
            a.other_complications as other_maternal_complications,
            a.haematinics as haematinics,
            a.referrals_from as referrals_from,
            a.referrals_to as referrals_to,
            a.reason_for_referral as reason_for_referral,
            a.remarks as remarks
        from
                etl.flat_mnch_summary a
        left JOIN
            amrs.patient_identifier b on
            a.person_id = b.patient_id
            AND b.identifier_type = 48
        INNER JOIN
            amrs.patient_identifier c ON
            a.person_id = c.patient_id
            AND c.identifier_type = 45
        left join amrs.person_name d on
            d.person_id = a.person_id
        left join amrs.person e on
            e.person_id = a.person_id
        left join amrs.location f on
            f.location_id = a.location_id
        left join amrs.person_attribute g on
            g.person_id = a.person_id
            AND g.person_attribute_type_id = 10
        where
            DATE(a.encounter_datetime)= '${params.endDate}'
            AND f.uuid in (${params.locationUuids});
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  },
  getMatRegisterData: (params) => {
    return new Promise((resolve, reject) => {
      let queryParts = {};
      const sql = `
        select
            a.encounter_datetime as admission_date,
            null as admission_number,
            b.identifier as NUPI,
            concat(c.given_name, ' ', c.middle_name, ' ', c.family_name) as full_names,
            h.birthdate as date_of_birth,
            timestampdiff(year,
            h.birthdate,
            a.encounter_datetime) as age,
            d.county_district as county_subcounty,
            d.city_village as village_estate_landmark,
            f.value as phone_number,
            case
                when g.value = 555 THEN 'MARRIED'
                when g.value = 1059 THEN 'WIDOWED'
                when g.value = 1057 THEN 'NEVER MARRIED'
                when g.value = 1175 THEN 'NOT APPLICABLE'
                when g.value = 1056 THEN 'SEPARATED'
            end as marital_status,
            a.parity as parity,
            a.gravidae as gravidae,
            a.anc_visit_no as no_of_anc_visits,
            a.last_lmp_date as lmp,
            a.edd as edd,
            a.diagnosis as diagnosis,
            a.duration_of_delivery as duration_of_labour,
            a.day_of_delivery as date_of_delivery,
            a.time_of_delivery as time_of_delivery,
            a.gestation_at_birth as gestation_at_birth,
            a.mode_of_delivery as mode_of_delivery,
            a.no_of_babies as no_of_babies_delivered,
            a.placenta_complete as placenta_complete,
            a.uterotonic_given as uterotonic_given,
            a.vaginal_examination as vaginal_examination,
            a.blood_loss as blood_loss,
            a.mothers_status_after_delivery as mothers_status_after_delivery,
            null as maternal_deaths_notified,
            a.maternal_death_notified as date_death_notified,
            a.delivery_complications as delivery_complications,
            a.apgar_score as apgaar_score,
            a.birth_outcome as birth_outcome,
            a.birth_weight as birth_weight,
            a.baby_sex as sex,
            a.BF_in_one_hour as initiated_on_BF_less_1hr,
            a.kangaroo_mother_care as kangaroo_mother_care,
            a.teo_at_birth as teo_given_at_birth,
            a.chlorhexidine_for_cord as chlorhexidine_applied_at_cord_stamp,
            a.birth_with_deformity as birth_with_deformity,
            a.type_of_deformity as type_of_deformity,
            a.vitamin_k as given_vitamin_K,
            a.rpr_test_result as vdrl_rpr,
            a.vdrl_test_result as vdrl_rpr_results,
            a.hiv_test_1_kit_name as hiv_test_1_kit_name,
            a.hiv_test_1_lot_no as hiv_test_1_lot_no,
            a.hiv_test_1_expiry_date as h1v_test_1_expiry,
            a.hiv_test_2_kit_name as hiv_test_2_kit_name,
            a.hiv_test_2_lot_no as hiv_test_2_lot_no,
            a.hiv_test_2_expiry_date as hiv_test_2_expiry,
            a.hiv_test_3_kit_name as hiv_test_3_kit_name,
            a.hiv_test_3_lot_no as hiv_test_3_lot_no,
            a.hiv_test_3_expiry_date as hiv_test_3_expiry,
            a.hiv_test_3_test_result as hiv_result_maternity,
            a.hiv_test_type as hiv_test_type,
            a.maternal_haart as maternal_haart,
            a.infant_prophylaxis as infant_prophylaxis,
            null as partner_tested_for_hiv,
            a.infant_feeding_counselling as couselled_on_infant_feeding,
            a.delivery_conducted_by as delivery_conducted_by,
            a.birth_notification_number as birth_notification_number,
            a.discharge_date as discharge_date,
            a.baby_status_on_discharge as discharge_status_of_baby,
            a.referrals_from as referrals_from,
            a.referrals_to as referrals_to,
            a.reason_for_referral as reason_for_referral,
            a.remarks as comments
        from
            etl.flat_mnch_summary a
        INNER JOIN
            amrs.patient_identifier b ON
            a.person_id = b.patient_id
            AND b.identifier_type = 45
        left join amrs.person_name c on
            c.person_id = a.person_id
        left join amrs.location d on
            d.location_id = a.location_id
        left join amrs.person_attribute f on
            f.person_id = a.person_id
            AND f.person_attribute_type_id = 10
        left join amrs.person_attribute g on
            g.person_id = a.person_id
            AND g.person_attribute_type_id = 5
        left join amrs.person h on
            h.person_id = a.person_id
        where
            DATE(a.encounter_datetime)= '${params.endDate}'
            AND d.uuid in (${params.locationUuids});
      `;
      queryParts = {
        sql: sql
      };
      return db.queryServer(queryParts, function (result) {
        result.sql = sql;
        resolve(result.result);
      });
    });
  }
};

module.exports = defs;
