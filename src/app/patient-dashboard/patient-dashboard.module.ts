import { NgModule } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http';
import { MdProgressSpinnerModule, MdProgressBarModule, MdSlideToggleModule, MdTabsModule
} from '@angular/material';

import { SharedModule, ConfirmDialogModule, DialogModule, MessagesModule,
TabViewModule, PanelModule
} from 'primeng/primeng';
import { Ng2PaginationModule } from 'ng2-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { routes } from './patient-dashboard.routes';
import { PatientDashboardGuard } from './patient-dashboard.guard';
import { PatientDashboardComponent } from './patient-dashboard.component';
import { ProgramService } from './programs/program.service';
import { PatientSearchService } from '../patient-search/patient-search.service';
import { PatientService } from './services/patient.service';
import { PatientPreviousEncounterService } from './services/patient-previous-encounter.service';
import { LabOrderSearchModule } from '../lab-order-search/lab-order-search.module';
import { PatientRoutesFactory } from '../navigation';
import { PatientDashboardCommonModule } from './common/patient-dashboard.common.module';
import { PatientDashboardHivModule } from './hiv/patient-dashboard-hiv.module';
import { PatientSearchModule } from '../patient-search/patient-search.module';
import { PatientProgramService } from './programs/patient-programs.service';
import { NgamrsSharedModule } from '../shared/ngamrs-shared.module';
import { PatientDashboardCdmModule } from './cdm/patient-dashboard-cdm.module';
import { PatientDashboardOncologyModule } from './oncology/patient-dashboard-cdm.module';
import {
  PatientDashboardDermatologyModule } from './dermatology/patient-dashboard-dermatology.module';
import { DepartmentProgramsConfigService } from '../etl-api/department-programs-config.service';
import { ProgramTransferCareModule } from './programs/transfer-care/transfer-care.module';
import { SessionStorageService } from '../utils/session-storage.service';
import { HttpClient } from '../shared/services/http-client.service';
import { ReferralModule } from '../referral-module/referral-module';
// import { PatientRegistrationModule } from '../patient-creation/patient-creation.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogModule,
    SharedModule,
    DialogModule,
    MessagesModule,
    TabViewModule,
    PanelModule,
    MdProgressSpinnerModule,
    MdProgressBarModule,
    MdTabsModule,
    MdSlideToggleModule,
    LabOrderSearchModule,
    Ng2PaginationModule,
    NgamrsSharedModule,
    NgSelectModule,
    PatientDashboardCdmModule,
    PatientDashboardOncologyModule,
    PatientDashboardCommonModule,
    PatientDashboardHivModule,
    PatientDashboardDermatologyModule,
    PatientSearchModule,
    ProgramTransferCareModule,
    ReferralModule,
    // PatientRegistrationModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    PatientDashboardComponent
  ],
  providers: [
    PatientDashboardGuard,
    PatientSearchService,
    PatientService,
    PatientProgramService,
    PatientPreviousEncounterService,
    ProgramService,
    DepartmentProgramsConfigService,
    DatePipe,
    PatientRoutesFactory,
    {
      provide: Http,
      useFactory: (xhrBackend: XHRBackend, requestOptions: RequestOptions,
                   router: Router, sessionStorageService: SessionStorageService) =>
        new HttpClient(xhrBackend, requestOptions, router, sessionStorageService),
      deps: [XHRBackend, RequestOptions, Router, SessionStorageService]
    }
  ],
  exports: [
  ]
})
export class PatientDashboardModule {
  public static routes = routes;
}