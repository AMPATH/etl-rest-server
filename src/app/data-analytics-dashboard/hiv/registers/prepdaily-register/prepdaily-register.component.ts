import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  Output,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import * as Moment from 'moment';
import { RegistersResourceService } from 'src/app/etl-api/registers-resource.service';
import * as html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf';
@Component({
  selector: 'app-prepdaily-register',
  templateUrl: './prepdaily-register.component.html',
  styleUrls: ['./prepdaily-register.component.css']
})
export class PrepdailyRegisterComponent implements OnInit {
  @Output()
  public params: any;
  public indicators: string;
  public selectedIndicators = [];
  public prepRegisterData: any = [];
  public columnDefs: any = [];
  public reportName = 'PrEP Daily Activity Register';
  public currentView = 'monthly';
  public currentViewBelow = 'pdf';
  public month: string;
  public year: number;
  public quarter: string;
  public eDate: string;
  public sDate: string;

  public statusError = false;
  public errorMessage = '';
  public showInfoMessage = false;
  public isLoading = false;
  public reportHead: any;
  public enabledControls = 'locationControl,monthControl';
  public pinnedBottomRowData: any = [];
  public _month: string;
  public isReleased = true;
  @ViewChild('prepcontentToSnapshot') contentToSnapshot!: ElementRef;

  public _locationUuids: any = [];
  public get locationUuids(): Array<string> {
    return this._locationUuids;
  }

  public set locationUuids(v: Array<string>) {
    const locationUuids = [];
    _.each(v, (location: any) => {
      if (location.value) {
        locationUuids.push(location);
      }
    });
    this._locationUuids = locationUuids;
  }

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    public register: RegistersResourceService,
    private datePipe: DatePipe
  ) {
    this.route.queryParams.subscribe((data) => {
      data.month === undefined
        ? (this._month = Moment()
            .subtract(1, 'M')
            .endOf('month')
            .format('YYYY-MM-DD'))
        : (this._month = data.month);

      this.showDraftReportAlert(this._month);
    });
  }

  ngOnInit() {}

  public onMonthChange(value): any {
    this._month = Moment(value).endOf('month').format('YYYY-MM-DD');
  }

  public generateReport(): any {
    this.route.parent.parent.params.subscribe((params: any) => {
      this.storeParamsInUrl(params.location_uuid);
    });
    this.prepRegisterData = [];
    this.getPrEPRegisterReport(this.params);
  }

  public storeParamsInUrl(param) {
    this.params = {
      locationUuids: param,
      _month: Moment(this._month).endOf('month').format('YYYY-MM-DD'),
      month: Moment(this._month).endOf('month').format('YYYY-MM-DD'),
      reportName: this.reportName,
      _date: Moment(this._month).format('DD-MM-YYYY')
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.params
    });
  }

  public getPrEPRegisterReport(params: any) {
    this.isLoading = true;
    this.register.getPrEPRegisterReport(params).subscribe((data) => {
      if (data.error) {
        this.showInfoMessage = true;
        this.errorMessage = `There has been an error while loading the report, please retry again`;
        this.isLoading = false;
      } else {
        this.showInfoMessage = false;
        this.prepRegisterData = data;
        this.isLoading = false;
        this.showDraftReportAlert(this._month);
      }
    });
  }

  public onIndicatorSelected(value) {
    this.router.navigate(['patient-list'], {
      relativeTo: this.route,
      queryParams: {
        indicators: value.field,
        indicatorHeader: value.headerName,
        indicatorGender: value.gender,
        month: this._month,
        locationUuids: value.location,
        currentView: this.currentView
      }
    });
  }

  public showDraftReportAlert(date) {
    if (date != null && date >= Moment().endOf('month').format('YYYY-MM-DD')) {
      this.isReleased = false;
    } else {
      this.isReleased = true;
    }
  }

  transformDate(date: string): string | null {
    return this.datePipe.transform(date, 'dd/MM/yyyy');
  }

  public takeSnapshotAndExport() {
    const elementToSnapshot = this.contentToSnapshot.nativeElement;

    html2canvas(elementToSnapshot).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('MOH 267 PrEP Daily Activity Register.pdf');
    });
  }
}