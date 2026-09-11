import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreatePhrmyGoodsReceiptRequest,
  CreatePhrmySaleRequest,
  PagedResponse,
  PhrmyBatch,
  PhrmyDashboard,
  PhrmyGoodsReceipt,
  PhrmyPurchaseOrder,
  PhrmyReturn,
  PhrmyRxQueueItem,
  PhrmySale,
  PhrmySalesReportRow,
  PhrmyStockMovementReportRow,
  PhrmyStockRow,
  PhrmySupplier,
  PhrmySupplierRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class PharmacyApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  // Suppliers
  getSuppliers(q: { search?: string; page?: number; pageSize?: number; activeOnly?: boolean } = {}) {
    return this.http.get<PagedResponse<PhrmySupplier>>(`${this.base}/pharmacy/suppliers`, {
      params: this.pageParams(q),
    });
  }
  createSupplier(body: PhrmySupplierRequest) {
    return this.http.post<PhrmySupplier>(`${this.base}/pharmacy/suppliers`, body);
  }
  updateSupplier(id: number, body: PhrmySupplierRequest) {
    return this.http.put<PhrmySupplier>(`${this.base}/pharmacy/suppliers/${id}`, body);
  }
  deleteSupplier(id: number) {
    return this.http.delete<void>(`${this.base}/pharmacy/suppliers/${id}`);
  }

  // Stock
  getStock(q: { search?: string; lowStockOnly?: boolean; page?: number; pageSize?: number } = {}) {
    let params = this.pageParams(q);
    if (q.lowStockOnly) params = params.set('lowStockOnly', 'true');
    return this.http.get<PagedResponse<PhrmyStockRow>>(`${this.base}/pharmacy/stock`, { params });
  }
  getBatches(medicineId?: number, expiringBefore?: string) {
    let params = new HttpParams();
    if (medicineId) params = params.set('medicineId', String(medicineId));
    if (expiringBefore) params = params.set('expiringBefore', expiringBefore);
    return this.http.get<PhrmyBatch[]>(`${this.base}/pharmacy/batches`, { params });
  }
  adjustStock(body: { batchId: number; qtyDelta: number; reason: string }) {
    return this.http.post<void>(`${this.base}/pharmacy/stock/adjustments`, body);
  }

  // Purchases
  getPurchaseOrders(q: { search?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResponse<PhrmyPurchaseOrder>>(`${this.base}/pharmacy/purchase-orders`, {
      params: this.pageParams(q),
    });
  }
  createPurchaseOrder(body: {
    supplierId: number;
    orderDate: string;
    notes?: string | null;
    lines: { medicineId: number; orderedQty: number; unitCost: number }[];
  }) {
    return this.http.post<PhrmyPurchaseOrder>(`${this.base}/pharmacy/purchase-orders`, body);
  }
  submitPurchaseOrder(id: number) {
    return this.http.post<PhrmyPurchaseOrder>(`${this.base}/pharmacy/purchase-orders/${id}/submit`, {});
  }
  cancelPurchaseOrder(id: number) {
    return this.http.post<PhrmyPurchaseOrder>(`${this.base}/pharmacy/purchase-orders/${id}/cancel`, {});
  }
  getGoodsReceipts(q: { search?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResponse<PhrmyGoodsReceipt>>(`${this.base}/pharmacy/goods-receipts`, {
      params: this.pageParams(q),
    });
  }
  createGoodsReceipt(body: CreatePhrmyGoodsReceiptRequest) {
    return this.http.post<PhrmyGoodsReceipt>(`${this.base}/pharmacy/goods-receipts`, body);
  }

  // Dispense / sales
  getRxQueue(q: { search?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResponse<PhrmyRxQueueItem>>(`${this.base}/pharmacy/rx-queue`, {
      params: this.pageParams(q),
    });
  }
  getSales(q: { search?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResponse<PhrmySale>>(`${this.base}/pharmacy/sales`, {
      params: this.pageParams(q),
    });
  }
  getSale(id: number) {
    return this.http.get<PhrmySale>(`${this.base}/pharmacy/sales/${id}`);
  }
  completeSale(body: CreatePhrmySaleRequest) {
    return this.http.post<PhrmySale>(`${this.base}/pharmacy/sales`, body);
  }

  // Returns
  getReturns(q: { search?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResponse<PhrmyReturn>>(`${this.base}/pharmacy/returns`, {
      params: this.pageParams(q),
    });
  }
  createReturn(body: { saleId: number; reason?: string | null; lines: { saleLineId: number; qty: number }[] }) {
    return this.http.post<PhrmyReturn>(`${this.base}/pharmacy/returns`, body);
  }

  // Reports
  getDashboard(): Observable<PhrmyDashboard> {
    return this.http.get<PhrmyDashboard>(`${this.base}/pharmacy/dashboard`);
  }
  getExpiring(withinDays = 90) {
    return this.http.get<PhrmyBatch[]>(`${this.base}/pharmacy/alerts/expiring`, {
      params: new HttpParams().set('withinDays', String(withinDays)),
    });
  }
  getLowStock() {
    return this.http.get<PhrmyStockRow[]>(`${this.base}/pharmacy/alerts/low-stock`);
  }
  getSalesReport(from: string, to: string) {
    return this.http.get<PhrmySalesReportRow[]>(`${this.base}/pharmacy/reports/sales`, {
      params: new HttpParams().set('from', from).set('to', to),
    });
  }
  getStockMovements(from: string, to: string) {
    return this.http.get<PhrmyStockMovementReportRow[]>(`${this.base}/pharmacy/reports/stock-movement`, {
      params: new HttpParams().set('from', from).set('to', to),
    });
  }

  private pageParams(q: { search?: string; page?: number; pageSize?: number; activeOnly?: boolean }): HttpParams {
    let params = new HttpParams();
    if (q.search) params = params.set('search', q.search);
    params = params.set('page', String(q.page ?? 1));
    params = params.set('pageSize', String(q.pageSize ?? 20));
    if (q.activeOnly) params = params.set('activeOnly', 'true');
    return params;
  }
}
