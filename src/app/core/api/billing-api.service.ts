import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  AddBillingManualLineRequest,
  BillingCashSession,
  BillingDayEndSummary,
  BillingInvoice,
  BillingPayment,
  CloseBillingCashSessionRequest,
  CreateBillingInvoiceFromVisitRequest,
  CreateBillingPaymentRequest,
  OpenBillingCashSessionRequest,
  PagedResponse,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getInvoices(q: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
    let params = this.pageParams(q);
    if (q.status) params = params.set('status', q.status);
    return this.http.get<PagedResponse<BillingInvoice>>(`${this.base}/billing/invoices`, { params });
  }

  getInvoice(id: number) {
    return this.http.get<BillingInvoice>(`${this.base}/billing/invoices/${id}`);
  }

  createFromVisit(body: CreateBillingInvoiceFromVisitRequest) {
    return this.http.post<BillingInvoice>(`${this.base}/billing/invoices/from-visit`, body);
  }

  addManualLine(invoiceId: number, body: AddBillingManualLineRequest) {
    return this.http.post<BillingInvoice>(`${this.base}/billing/invoices/${invoiceId}/lines`, body);
  }

  voidInvoice(id: number) {
    return this.http.post<BillingInvoice>(`${this.base}/billing/invoices/${id}/void`, {});
  }

  recordPayment(body: CreateBillingPaymentRequest) {
    return this.http.post<BillingPayment>(`${this.base}/billing/payments`, body);
  }

  getSessions(businessDate?: string) {
    let params = new HttpParams();
    if (businessDate) params = params.set('businessDate', businessDate);
    return this.http.get<BillingCashSession[]>(`${this.base}/billing/cashier/sessions`, { params });
  }

  getOpenHead(businessDate?: string) {
    let params = new HttpParams();
    if (businessDate) params = params.set('businessDate', businessDate);
    return this.http.get<BillingCashSession>(`${this.base}/billing/cashier/head`, { params });
  }

  getMyOpenSub() {
    return this.http.get<BillingCashSession>(`${this.base}/billing/cashier/my-sub`);
  }

  openHead(body: OpenBillingCashSessionRequest) {
    return this.http.post<BillingCashSession>(`${this.base}/billing/cashier/head/open`, body);
  }

  openSub(body: OpenBillingCashSessionRequest) {
    return this.http.post<BillingCashSession>(`${this.base}/billing/cashier/sub/open`, body);
  }

  closeSub(id: number, body: CloseBillingCashSessionRequest) {
    return this.http.post<BillingCashSession>(`${this.base}/billing/cashier/sub/${id}/close`, body);
  }

  closeHead(id: number, body: CloseBillingCashSessionRequest) {
    return this.http.post<BillingCashSession>(`${this.base}/billing/cashier/head/${id}/close`, body);
  }

  getDayEnd(businessDate?: string): Observable<BillingDayEndSummary> {
    let params = new HttpParams();
    if (businessDate) params = params.set('businessDate', businessDate);
    return this.http.get<BillingDayEndSummary>(`${this.base}/billing/reports/day-end`, { params });
  }

  private pageParams(q: { search?: string; page?: number; pageSize?: number }): HttpParams {
    let params = new HttpParams();
    if (q.search) params = params.set('search', q.search);
    params = params.set('page', String(q.page ?? 1));
    params = params.set('pageSize', String(q.pageSize ?? 20));
    return params;
  }
}
