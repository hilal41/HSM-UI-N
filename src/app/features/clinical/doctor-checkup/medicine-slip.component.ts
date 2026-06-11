import { NgClass, NgStyle } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import type {
  CheckupSaveResponse,
  Hospital,
  Patient,
  PatientMedicineLine,
  PatientVisitResponse,
} from '../../../core/models/api-contracts';
import type { CheckupFormDoc, CheckupFormField } from '../checkup-templates/checkup-form-doc.model';
import {
  parseCheckupResponsesJson,
  type CheckupFieldValue,
} from './checkup-responses.model';
import {
  type MedicineSlipColumnId,
  type MedicineSlipSectionId,
  type MedicineSlipTemplate,
  visibleMedicineSlipSectionOrder,
} from './medicine-slip-template';

export type { MedicineSlipSectionId };

interface CheckupPrintRow {
  label: string;
  value: string;
}

interface CheckupPrintSection {
  title: string;
  rows: CheckupPrintRow[];
}

@Component({
  selector: 'app-medicine-slip',
  imports: [NgClass, NgStyle],
  templateUrl: './medicine-slip.component.html',
  styleUrl: './medicine-slip.component.scss',
})
export class MedicineSlipComponent implements OnChanges {
  @Input({ required: true }) patient: Patient | null = null;
  @Input({ required: true }) hospital: Hospital | null = null;
  @Input({ required: true }) visit: PatientVisitResponse | null = null;
  @Input({ required: true }) checkup: CheckupSaveResponse | null = null;
  @Input() checkupFormDoc: CheckupFormDoc | null = null;
  @Input({ required: true }) template!: MedicineSlipTemplate;

  slipGeneratedLabel = '';

  get visibleSections(): MedicineSlipSectionId[] {
    return visibleMedicineSlipSectionOrder(this.template);
  }

  get medicines(): PatientMedicineLine[] {
    return this.checkup?.medicines ?? [];
  }

  get visibleColumns(): MedicineSlipColumnId[] {
    return this.template.visibleMedicineColumns;
  }

  get checkupPrintSections(): CheckupPrintSection[] {
    if (!this.checkupFormDoc || !this.checkup?.responsesJson) return [];
    const values = parseCheckupResponsesJson(this.checkup.responsesJson, this.checkupFormDoc);
    const sections: CheckupPrintSection[] = [];

    for (const section of this.checkupFormDoc.sections) {
      const rows = section.fields
        .map((field) => ({
          label: field.label,
          value: this.formatFieldValue(field, values[field.id]),
        }))
        .filter((row) => row.value.length > 0);

      if (rows.length > 0) {
        sections.push({ title: section.title, rows });
      }
    }

    return sections;
  }

  get hospitalLogoSrc(): string | null {
    const b = this.hospital?.logoBase64?.trim();
    if (!b) return null;
    return b.startsWith('data:') ? b : `data:image/png;base64,${b}`;
  }

  get patientAgeYears(): number {
    if (!this.patient?.dateOfBirth) return 0;
    const dob = new Date(this.patient.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return 0;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const beforeBirthday =
      now.getMonth() < dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
    if (beforeBirthday) age -= 1;
    return Math.max(0, age);
  }

  showHospitalLogo(): boolean {
    return !!this.template.hospitalShowLogo && !!this.hospitalLogoSrc;
  }

  hospitalLayoutClass(): string {
    const p = this.template.logoPlacement;
    if (p === 'inline-start' || p === 'inline-end') {
      return `mslip-hospital-layout mslip-hospital-layout--inline mslip-hospital-layout--${p}`;
    }
    return 'mslip-hospital-layout mslip-hospital-layout--stack';
  }

  hospitalTextClass(): string {
    return `mslip-hospital-text mslip-hospital-text--${this.template.hospitalBlockAlign}`;
  }

  headerAlignClass(): string {
    return `mslip-header mslip-header--align-${this.template.headerTextAlign}`;
  }

  bodySectionClass(): string {
    return `mslip-body-wrap mslip-body-wrap--${this.template.bodySectionsAlign}`;
  }

  slipSurfaceStyle(): Record<string, string> {
    const t = this.template;
    const s = t.globalTextScale;
    const fz = (px: number) => `${Math.round(px * s)}px`;
    return {
      '--mslip-font-family': t.fontFamily,
      '--mslip-base': fz(t.baseFontSizePx),
      '--mslip-title': fz(t.titleFontSizePx),
      '--mslip-heading': fz(t.headingFontSizePx),
      '--mslip-table': fz(t.tableFontSizePx),
      '--mslip-lh': String(t.lineHeight),
      '--mslip-body': t.bodyColor,
      '--mslip-title-c': t.titleColor,
      '--mslip-muted': t.mutedColor,
      '--mslip-border': t.borderColor,
      fontFamily: t.fontFamily,
      fontSize: fz(t.baseFontSizePx),
      color: t.bodyColor,
      lineHeight: String(t.lineHeight),
      padding: `${t.paddingTopMm}mm ${t.paddingRightMm}mm ${t.paddingBottomMm}mm ${t.paddingLeftMm}mm`,
      margin: `${t.marginTopMm}mm ${t.marginRightMm}mm ${t.marginBottomMm}mm ${t.marginLeftMm}mm`,
      boxSizing: 'border-box',
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] || changes['visit'] || changes['checkup']) {
      this.slipGeneratedLabel = new Date().toLocaleString();
    }
  }

  columnLabel(id: MedicineSlipColumnId): string {
    switch (id) {
      case 'medicineName':
        return 'Medicine';
      case 'code':
        return 'Code';
      case 'form':
        return 'Form';
      case 'strength':
        return 'Strength';
      case 'usageShortCode':
        return 'Usage';
      case 'usageDescription':
        return 'Usage details';
    }
  }

  columnValue(row: PatientMedicineLine, id: MedicineSlipColumnId): string {
    switch (id) {
      case 'medicineName':
        return row.medicineName;
      case 'code':
        return row.code;
      case 'form':
        return row.form;
      case 'strength':
        return row.strength || '—';
      case 'usageShortCode':
        return row.medicineUsageShortCode || '—';
      case 'usageDescription':
        return row.medicineUsageDescription || '—';
    }
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString();
  }

  private formatFieldValue(field: CheckupFormField, value: CheckupFieldValue): string {
    if (field.type === 'checkbox') return value === true ? 'Yes' : '';
    if (value == null) return '';
    const text = String(value).trim();
    return text;
  }
}
