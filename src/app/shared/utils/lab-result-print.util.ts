import type { LabOrderLine, LabOrderResponse } from '../../core/models/api-contracts';

export function printLabResultReport(order: LabOrderResponse, hospitalName?: string | null): void {
  const released = order.lines.filter((l) => l.status === 'Released' && hasLineResult(l));
  if (released.length === 0) return;

  const rows = released.flatMap((line) => formatLineRows(line)).join('');

  const html = `<!DOCTYPE html>
<html><head><title>Lab Report ${escapeHtml(order.orderNumber)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
  h1 { font-size: 1.25rem; margin: 0 0 4px; }
  .meta { font-size: 0.875rem; color: #475569; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
  th { background: #f1f5f9; }
  .panel-head td { background: #f8fafc; font-weight: 600; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>Laboratory Report</h1>
  <div class="meta">
    ${hospitalName ? `<div>${escapeHtml(hospitalName)}</div>` : ''}
    <div>Order: ${escapeHtml(order.orderNumber)} · ${escapeHtml(order.patientName)} (${escapeHtml(order.patientNumber ?? '')})</div>
    <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
  </div>
  <table>
    <thead><tr><th>Test / Parameter</th><th>Accession</th><th>Result</th><th>Unit</th><th>Reference</th><th>Flag</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function formatLineRows(line: LabOrderLine): string {
  const accession = escapeHtml(line.accessionNumber ?? '—');
  const params = line.result?.parameters?.filter((p) => p.value) ?? [];
  if (params.length > 0) {
    const head = `<tr class="panel-head"><td colspan="6">${escapeHtml(line.testName)}${
      line.accessionNumber ? ` · Acc: ${accession}` : ''
    }</td></tr>`;
    const body = params
      .map(
        (p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${accession}</td>
        <td><strong>${escapeHtml(p.value ?? '—')}</strong></td>
        <td>${escapeHtml(p.unit ?? '—')}</td>
        <td>${escapeHtml(p.referenceRange ?? '—')}</td>
        <td>${escapeHtml(p.abnormalFlag ?? 'Normal')}</td>
      </tr>`,
      )
      .join('');
    return head + body;
  }

  return `
      <tr>
        <td>${escapeHtml(line.testName)}</td>
        <td>${accession}</td>
        <td><strong>${escapeHtml(line.result?.value ?? '—')}</strong></td>
        <td>${escapeHtml(line.result?.unit ?? '—')}</td>
        <td>${escapeHtml(line.result?.referenceRange ?? '—')}</td>
        <td>${escapeHtml(line.result?.abnormalFlag ?? 'Normal')}</td>
      </tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function hasLineResult(line: LabOrderLine): boolean {
  if (line.result?.value) return true;
  return (line.result?.parameters?.some((p) => p.value) ?? false);
}

export function hasPrintableResults(lines: LabOrderLine[]): boolean {
  return lines.some((l) => l.status === 'Released' && hasLineResult(l));
}

export function formatLineResultSummary(line: LabOrderLine): string {
  const params = line.result?.parameters?.filter((p) => p.value) ?? [];
  if (params.length > 0) {
    return params.map((p) => `${p.name}: ${p.value}${p.unit ? ` ${p.unit}` : ''}`).join('; ');
  }
  if (line.result?.value) {
    return `${line.result.value}${line.result.unit ? ` ${line.result.unit}` : ''}`;
  }
  return '—';
}
