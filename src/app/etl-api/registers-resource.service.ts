import { Injectable } from '@angular/core';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as Moment from 'moment';
import { catchError, map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class RegistersResourceService {
  public get url(): string {
    return this.appSettingsService.getEtlRestbaseurl().trim();
  }
  constructor(
    public http: HttpClient,
    public appSettingsService: AppSettingsService
  ) {}
  public getPrEPRegisterReport(params: any): Observable<any> {
    return this.http
      .get(
        `${this.url}registers/prepregisterdata?month=${params.month}&locationUuids=${params.locationUuids}`
      )
      .pipe(
        catchError((err: any) => {
          const error: any = err;
          const errorObj = {
            error: error.status,
            message: error.statusText
          };
          return Observable.of(errorObj);
        }),
        map((response: Response) => {
          return response;
        })
      );
  }
  public getDefaulterTracingRegister(params: any): Observable<any> {
    return this.http
      .get(
        `${this.url}registers/defaultertracing?month=${params.month}&locationUuids=${params.locationUuids}`
      )
      .pipe(
        catchError((err: any) => {
          const error: any = err;
          const errorObj = {
            error: error.status,
            message: error.statusText
          };
          return Observable.of(errorObj);
        }),
        map((response: Response) => {
          return response;
        })
      );
  }
}
