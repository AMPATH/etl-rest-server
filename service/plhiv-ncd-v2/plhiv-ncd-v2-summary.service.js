import ReportProcessorHelpersService from '../../app/reporting-framework/report-processor-helpers.service.js';
import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report.js';

const _ = require('lodash');
const Moment = require('moment');

const plhivncdV2ReportSections = require('../../app/reporting-framework/json-reports/plhiv-ncd-v2-reports/plhiv-ncd-v2-report-indicators.json');
const plhivncdV2ReportPatientListCols = require('../../app/reporting-framework/json-reports/plhiv-ncd-v2-reports/plhiv-ncd-v2-report-patient-list-cols.json');

const etlHelpers = require('../../etl-helpers.js');

export class PLHIVNCDv2SummaryReportService extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, params);
    params.hivMonthlyDatasetSource = 'etl.hiv_monthly_report_dataset_frozen';
  }

  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      that
        .getSourceTables()
        .then((sourceTables) => {
          console.log("source-table: ", sourceTables)
          that.params.hivMonthlyDatasetSource =
            sourceTables.hivMonthlyDatasetSource;
          // super.generateReport(additionalParams).then((results) => {
            if (additionalParams && additionalParams.type === 'patient-list') {
              resolve(results);
            } else {
              // let finalResult = [];
              // const reportProcessorHelpersService = new ReportProcessorHelpersService();
              // for (let result of results) {
              //   if (
              //     result.report &&
              //     result.report.reportSchemas &&
              //     result.report.reportSchemas.main &&
              //     result.report.reportSchemas.main.transFormDirectives
              //       .joinColumn
              //   ) {
              //     finalResult = reportProcessorHelpersService.joinDataSets(
              //       that.params[
              //         result.report.reportSchemas.main.transFormDirectives
              //           .joinColumnParam
              //       ] ||
              //         result.report.reportSchemas.main.transFormDirectives
              //           .joinColumn,
              //       finalResult,
              //       result.results.results.results
              //     );
              //   }
              // }

              // resolve({
              //   queriesAndSchemas: results,
              //   result: finalResult,
              //   sectionDefinitions: plhivncdV2ReportSections,
              //   indicatorDefinitions: []
              // });
              //test
              resolve({
                queriesAndSchemas: [],
                result: [
                  {
                    "join_location": 1,
                    "location_uuid": "08feae7c-1352-11df-a1f1-0026b9348838",
                    "mfl_code": 15204,
                    "county": "Uasin Gishu",
                    "facility": "Moi Teaching Refferal Hospital",
                    "location_id": 1,
                    "location": "MTRH Module 1",
                    "nw_ctld_htn_m": 1,
                    "tot_nw_ctld_htn": 2,
                    "ct_ctld_htn_f": 10,
                    "ct_ctld_htn_m": 10,
                    "tot_ct_ctld_htn": 5,
                    "nw_unctld_htn_f": 4,
                    "nw_unctld_htn_m": 10,
                    "tot_nw_unctld_htn": 8,
                    "ct_unctld_htn_f": 5,
                    "ct_unctld_htn_m": 0,
                    "tot_ct_unctld_htn": 1,
                    "nw_unk_htn_f": 6,
                    "nw_unk_htn_m": 0,
                    "tot_nw_unk_htn": 2,
                    "ct_unk_htn_f": 5,
                    "ct_unk_htn_m": 3,
                    "tot_ct_unk_htn": 3,
                    "nw_htn_m": 5,
                    "nw_htn_f": 3,
                    "nw_htn": 9,
                    "ct_htn_m": 5,
                    "ct_htn_f": 7,
                    "ct_htn": 3,
                    "tot_htn": 10,
                    "nw_ctld_dm_f": 2,
                    "nw_ctld_dm_m": 1,
                    "tot_nw_ctld_dm": 0,
                    "ct_ctld_dm_f": 8,
                    "ct_ctld_dm_m": 6,
                    "tot_ct_ctld_dm": 2,
                    "nw_unctld_dm_f": 2,
                    "nw_unctld_dm_m": 10,
                    "tot_nw_unctld_dm": 6,
                    "ct_unctld_dm_f": 5,
                    "ct_unctld_dm_m": 2,
                    "tot_ct_unctld_dm": 5,
                    "nw_unk_dm_f": 0,
                    "nw_unk_dm_m": 4,
                    "tot_nw_unk_dm": 10,
                    "ct_unk_dm_f": 7,
                    "ct_unk_dm_m": 1,
                    "tot_ct_unk_dm": 5,
                    "nw_dm_m": 6,
                    "nw_dm_f": 8,
                    "nw_dm": 10,
                    "ct_dm_m": 4,
                    "ct_dm_f": 5,
                    "ct_dm": 6,
                    "tot_dm": 9,
                    "stg_1_nw_chr_m": 5,
                    "stg_1_nw_chr_f": 3,
                    "tot_stg_1_nw_chr": 3,
                    "stg_1_ct_chr_m": 9,
                    "stg_1_ct_chr_f": 6,
                    "tot_stg_1_ct_chr": 9,
                    "stg_1_nw_acu_m": 3,
                    "stg_1_nw_acu_f": 9,
                    "tot_stg_1_nw_acu": 3,
                    "stg_1_ct_acu_m": 7,
                    "stg_1_ct_acu_f": 3,
                    "tot_stg_1_ct_acu": 2,
                    "stg_2_nw_chr_m": 9,
                    "stg_2_nw_chr_f": 1,
                    "tot_stg_2_nw_chr": 10,
                    "stg_2_ct_chr_m": 3,
                    "stg_2_ct_chr_f": 9,
                    "tot_stg_2_ct_chr": 5,
                    "stg_2_nw_acu_m": 8,
                    "stg_2_nw_acu_f": 9,
                    "tot_stg_2_nw_acu": 2,
                    "stg_2_ct_acu_m": 3,
                    "stg_2_ct_acu_f": 0,
                    "tot_stg_2_ct_acu": 2,
                    "stg_3_nw_chr_m": 10,
                    "stg_3_nw_chr_f": 10,
                    "tot_stg_3_nw_chr": 7,
                    "stg_3_ct_chr_m": 2,
                    "stg_3_ct_chr_f": 5,
                    "tot_stg_3_ct_chr": 6,
                    "stg_3_nw_acu_m": 8,
                    "stg_3_nw_acu_f": 4,
                    "tot_stg_3_nw_acu": 2,
                    "stg_3_ct_acu_m": 0,
                    "stg_3_ct_acu_f": 3,
                    "tot_stg_3_ct_acu": 1,
                    "stg_4_nw_chr_m": 3,
                    "stg_4_nw_chr_f": 10,
                    "tot_stg_4_nw_chr": 10,
                    "stg_4_ct_chr_m": 2,
                    "stg_4_ct_chr_f": 9,
                    "tot_stg_4_ct_chr": 1,
                    "stg_4_nw_acu_m": 1,
                    "stg_4_nw_acu_f": 4,
                    "tot_stg_4_nw_acu": 8,
                    "stg_4_ct_acu_m": 7,
                    "stg_4_ct_acu_f": 2,
                    "tot_stg_4_ct_acu": 7,
                    "stg_5_nw_chr_m": 5,
                    "stg_5_nw_chr_f": 4,
                    "tot_stg_5_nw_chr": 9,
                    "stg_5_ct_chr_m": 8,
                    "stg_5_ct_chr_f": 8,
                    "tot_stg_5_ct_chr": 4,
                    "stg_5_nw_acu_m": 10,
                    "stg_5_nw_acu_f": 10,
                    "tot_stg_5_nw_acu": 4,
                    "stg_5_ct_acu_m": 6,
                    "stg_5_ct_acu_f": 2,
                    "tot_stg_5_ct_acu": 8,
                    "sub_tot_chr": 1,
                    "sub_tot_acu": 0,
                    "hf_nw_m": 9,
                    "hf_nw_f": 6,
                    "tot_hf_nw": 2,
                    "hf_ct_m": 7,
                    "hf_ct_f": 8,
                    "tot_hf_ct": 6,
                    "myo_inf_nw_m": 2,
                    "myo_inf_nw_f": 4,
                    "tot_myo_inf_nw": 4,
                    "myo_inf_ct_m": 5,
                    "myo_inf_ct_f": 3,
                    "tot_myo_inf_ct": 9,
                    "sub_tot_ct_cvd_m": 4,
                    "sub_tot_ct_cvd_f": 7,
                    "sub_tot_ct_cvd": 1,
                    "tot_cvd": 5,
                    "mg_nw_m": 7,
                    "mg_nw_f": 5,
                    "tot_mg_nw": 5,
                    "mg_ct_m": 3,
                    "mg_ct_f": 4,
                    "tot_mg_ct": 9,
                    "cnv_nw_m": 5,
                    "cnv_nw_f": 7,
                    "tot_cnv_nw": 10,
                    "cnv_ct_m": 5,
                    "cnv_ct_f": 7,
                    "tot_cnv_ct": 10,
                    "sub_tot_nw_cnv_m": 9,
                    "sub_tot_nw_cnv_f": 4,
                    "sub_tot_nw_cnv": 6,
                    "sub_tot_ct_cnv_m": 9,
                    "sub_tot_ct_cnv_f": 7,
                    "sub_tot_ct_cnv": 1,
                    "tot_cnv": 1,
                    "ra_nw_m": 10,
                    "ra_nw_f": 1,
                    "tot_ra_nw": 4,
                    "ra_ct_m": 8,
                    "ra_ct_f": 9,
                    "tot_ra_ct": 0,
                    "sle_nw_m": 9,
                    "sle_nw_f": 5,
                    "tot_sle_nw": 2,
                    "sle_ct_m": 2,
                    "sle_ct_f": 6,
                    "tot_sle_ct": 8,
                    "sub_tot_nw_rhe_m": 8,
                    "sub_tot_nw_rhe_f": 7,
                    "sub_tot_nw_rhe": 10,
                    "sub_tot_ct_rhe_m": 3,
                    "sub_tot_ct_rhe_f": 10,
                    "sub_tot_ct_rhe": 2,
                    "tot_rhe": 9,
                    "oe_nw_m": 8,
                    "oe_nw_f": 4,
                    "tot_oe_nw": 7,
                    "oe_ct_m": 3,
                    "oe_ct_f": 6,
                    "tot_oe_ct": 8,
                    "pc_nw_m": 9,
                    "pc_nw_f": 3,
                    "tot_pc_nw": 6,
                    "pc_ct_m": 5,
                    "pc_ct_f": 8,
                    "tot_pc_ct": 3,
                    "gs_nw_m": 2,
                    "gs_nw_f": 6,
                    "tot_gs_nw": 10,
                    "gs_ct_m": 1,
                    "gs_ct_f": 3,
                    "tot_gs_ct": 5,
                    "col_nw_m": 9,
                    "col_nw_f": 1,
                    "tot_col_nw": 6,
                    "col_ct_m": 9,
                    "col_ct_f": 10,
                    "tot_col_ct": 0,
                    "sub_tot_nw_gi_m": 1,
                    "sub_tot_nw_gi_f": 5,
                    "sub_tot_nw_gi": 10,
                    "sub_tot_ct_gi_m": 8,
                    "sub_tot_ct_gi_f": 10,
                    "sub_tot_ct_gi": 9,
                    "tot_gi": 10,
                    "ov_nw": 3,
                    "ov_ct": 10,
                    "cv_nw": 6,
                    "cv_ct": 1,
                    "endo_nw": 6,
                    "endo_ct": 5,
                    "tot_f_rep_nw": 10,
                    "tot_f_rep_ct": 7,
                    "tot_f_rep": 0,
                    "pro_nw": 4,
                    "pro_ct": 1,
                    "ts_nw": 0,
                    "ts_ct": 2,
                    "tot_m_rep_nw": 4,
                    "tot_m_rep_ct": 5,
                    "tot_m_rep": 9,
                    "th_nw_m": 9,
                    "th_nw_f": 6,
                    "tot_th_nw": 1,
                    "th_ct_m": 5,
                    "th_ct_f": 6,
                    "tot_th_ct": 1,
                    "pit_nw_m": 10,
                    "pit_nw_f": 10,
                    "tot_pit_nw": 10,
                    "pit_ct_m": 1,
                    "pit_ct_f": 8,
                    "tot_pit_ct": 7,
                    "thy_nw_m": 3,
                    "thy_nw_f": 7,
                    "tot_thy_nw": 9,
                    "thy_ct_m": 2,
                    "thy_ct_f": 6,
                    "tot_thy_ct": 10,
                    "adr_nw_m": 5,
                    "adr_nw_f": 4,
                    "tot_adr_nw": 6,
                    "adr_ct_m": 0,
                    "adr_ct_f": 5,
                    "tot_adr_ct": 1,
                    "sub_tot_nw_endo_m": 3,
                    "sub_tot_nw_endo_f": 10,
                    "sub_tot_nw_endo": 8,
                    "sub_tot_ct_endo_m": 7,
                    "sub_tot_ct_endo_f": 8,
                    "sub_tot_ct_endo": 3,
                    "tot_endo": 5,
                    "ost_nw_m": 5,
                    "ost_nw_f": 9,
                    "tot_ost_nw": 5,
                    "ost_ct_m": 9,
                    "ost_ct_f": 6,
                    "tot_ost_ct": 10,
                    "tot_musk": 1,
                    "leu_nw_m": 6,
                    "leu_nw_f": 10,
                    "tot_leu_nw": 10,
                    "leu_ct_m": 9,
                    "leu_ct_f": 9,
                    "tot_leu_ct": 2,
                    "lym_nw_m": 3,
                    "lym_nw_f": 3,
                    "tot_lym_nw": 6,
                    "lym_ct_m": 3,
                    "lym_ct_f": 0,
                    "tot_lym_ct": 5,
                    "sub_tot_nw_hae_m": 5,
                    "sub_tot_nw_hae_f": 4,
                    "sub_tot_nw_hae": 9,
                    "sub_tot_ct_hae_m": 7,
                    "sub_tot_ct_hae_f": 6,
                    "sub_tot_ct_hae": 10,
                    "tot_hae": 3,
                    "ggn_nw_m": 1,
                    "ggn_nw_f": 10,
                    "tot_ggn_nw": 8,
                    "ggn_ct_m": 4,
                    "ggn_ct_f": 5,
                    "tot_ggn_ct": 6,
                    "cpt_nw_m": 0,
                    "cpt_nw_f": 10,
                    "tot_cpt_nw": 1,
                    "cpt_ct_m": 8,
                    "cpt_ct_f": 3,
                    "tot_cpt_ct": 0,
                    "emb_nw_m": 1,
                    "emb_nw_f": 3,
                    "tot_emb_nw": 4,
                    "emb_ct_m": 4,
                    "emb_ct_f": 3,
                    "tot_emb_ct": 5,
                    "pin_nw_m": 3,
                    "pin_nw_f": 9,
                    "tot_pin_nw": 10,
                    "pin_ct_m": 5,
                    "pin_ct_f": 3,
                    "tot_pin_ct": 6,
                    "men_nw_m": 7,
                    "men_nw_f": 9,
                    "tot_men_nw": 10,
                    "men_ct_m": 6,
                    "men_ct_f": 5,
                    "tot_men_ct": 4,
                    "mes_nw_m": 2,
                    "mes_nw_f": 5,
                    "tot_mes_nw": 6,
                    "mes_ct_m": 3,
                    "mes_ct_f": 6,
                    "tot_mes_ct": 4,
                    "mel_nw_m": 0,
                    "mel_nw_f": 5,
                    "tot_mel_nw": 8,
                    "mel_ct_m": 2,
                    "mel_ct_f": 1,
                    "tot_mel_ct": 0,
                    "hly_nw_m": 8,
                    "hly_nw_f": 3,
                    "tot_hly_nw": 0,
                    "hly_ct_m": 9,
                    "hly_ct_f": 5,
                    "tot_hly_ct": 4,
                    "gct_nw_m": 7,
                    "gct_nw_f": 8,
                    "tot_gct_nw": 4,
                    "gct_ct_m": 1,
                    "gct_ct_f": 8,
                    "tot_gct_ct": 10,
                    "sub_tot_nw_neu_m": 1,
                    "sub_tot_nw_neu_f": 2,
                    "sub_tot_nw_neu": 9,
                    "sub_tot_ct_neu_m": 8,
                    "sub_tot_ct_neu_f": 3,
                    "sub_tot_ct_neu": 2,
                    "tot_neu": 2
                  }
                ],
                sectionDefinitions: plhivncdV2ReportSections,
                indicatorDefinitions: []
              });
            }
          // });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  getSourceTables() {
    const self = this;
    return new Promise((resolve, reject) => {
      let query = 'select * from etl.moh_731_last_release_month';
      let runner = self.getSqlRunner();

      runner
        .executeQuery(query)
        .then((results) => {
          const lastReleasedMonth = results[0]['last_released_month'];
          let sourceTables = {
            hivMonthlyDatasetSource: this.determineSourceTable(
              self.params.endingMonth,
              lastReleasedMonth
            )
          };

          resolve(sourceTables);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  determineSourceTable(month, lastReleasedMonth) {
    // set default source table to frozen table
    let sourceTable = 'etl.hiv_monthly_report_dataset_frozen';
    if (Moment(lastReleasedMonth).isSameOrAfter(Moment(month))) {
      sourceTable = 'etl.hiv_monthly_report_dataset_frozen';
    } else {
      sourceTable = 'etl.hiv_monthly_report_dataset_v1_2';
    }
    return sourceTable;
  }

  generatePatientListReport(reportParams) {
    const indicators = reportParams.requestIndicators.split(',') || [];
    let self = this;
    return new Promise((resolve, reject) => {
      super
        .generatePatientListReport(indicators)
        .then((results) => {
          let result = results.result;
          results['results'] = {
            results: result
          };
          results['patientListCols'] = plhivncdV2ReportPatientListCols;
          delete results['result'];
          _.each(results.results.results, (row) => {
            row.cur_meds = etlHelpers.getARVNames(row.cur_meds);
          });
          resolve(results);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
