import { NgClass, NgStyle } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import type { Hospital, Patient } from '../../../core/models/api-contracts';
import {
  type RegistrationSlipTemplate,
  visibleSlipSectionOrder,
  type SlipSectionId,
} from './registration-slip-template';

export interface PatientRegistrationSlipLineVm {
  serviceTitle: string;
  serviceCode: string;
  doctorName: string;
  servicePrice: number;
  serviceDiscount: number;
  remarks: string;
}

export type { SlipSectionId };

@Component({
  selector: 'app-patient-registration-slip',
  imports: [NgClass, NgStyle],
  templateUrl: './patient-registration-slip.component.html',
  styleUrl: './patient-registration-slip.component.scss',
})
export class PatientRegistrationSlipComponent implements OnChanges {
  @Input({ required: true }) patient: Patient | null = null;
  @Input({ required: true }) hospital: Hospital | null = null;
  @Input({ required: true }) template!: RegistrationSlipTemplate;
  @Input({ required: true }) lines: PatientRegistrationSlipLineVm[] = [];
  @Input({ required: true }) visitRemarks = '';
  @Input({ required: true }) totalAmount = 0;
  @Input({ required: true }) discountAmount = 0;
  @Input({ required: true }) ageYears = 0;
  @Input() branchName: string | null = null;

  slipGeneratedLabel = '';

  get visibleSections(): SlipSectionId[] {
    return visibleSlipSectionOrder(this.template);
  }

  get hospitalLogoSrc(): string | null {
    const b = this.hospital?.logoBase64?.trim();
    if (!b) {
      return null;
    }
    if (b.startsWith('data:')) {
      return b;
    }
    return `data:image/png;base64,${b}`;
  }

  showHospitalLogo(): boolean {
    return !!this.template.hospitalShowLogo && !!this.hospitalLogoSrc;
  }

  hospitalLayoutClass(): string {
    const p = this.template.logoPlacement;
    if (p === 'inline-start' || p === 'inline-end') {
      return `slip-hospital-layout slip-hospital-layout--inline slip-hospital-layout--${p}`;
    }
    return 'slip-hospital-layout slip-hospital-layout--stack';
  }

  hospitalTextClass(): string {
    return `slip-hospital-text slip-hospital-text--${this.template.hospitalBlockAlign}`;
  }

  headerAlignClass(): string {
    return `slip-header slip-header--align-${this.template.headerTextAlign}`;
  }

  bodySectionClass(): string {
    return `slip-body-wrap slip-body-wrap--${this.template.bodySectionsAlign}`;
  }

  slipSurfaceStyle(): Record<string, string> {
    const t = this.template;
    const s = t.globalTextScale;
    const fz = (px: number) => `${Math.round(px * s)}px`;
    return {
      '--slip-font-family': t.fontFamily,
      '--slip-base': fz(t.baseFontSizePx),
      '--slip-title': fz(t.titleFontSizePx),
      '--slip-heading': fz(t.headingFontSizePx),
      '--slip-table': fz(t.tableFontSizePx),
      '--slip-lh': String(t.lineHeight),
      '--slip-body': t.bodyColor,
      '--slip-title-c': t.titleColor,
      '--slip-muted': t.mutedColor,
      '--slip-border': t.borderColor,
      '--slip-pad': `${t.paddingTopMm}mm ${t.paddingRightMm}mm ${t.paddingBottomMm}mm ${t.paddingLeftMm}mm`,
      'font-family': t.fontFamily,
      'font-size': fz(t.baseFontSizePx),
      color: t.bodyColor,
      lineHeight: String(t.lineHeight),
      padding: `${t.paddingTopMm}mm ${t.paddingRightMm}mm ${t.paddingBottomMm}mm ${t.paddingLeftMm}mm`,
      margin: `${t.marginTopMm}mm ${t.marginRightMm}mm ${t.marginBottomMm}mm ${t.marginLeftMm}mm`,
      boxSizing: 'border-box',
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] || changes['lines'] || changes['visitRemarks']) {
      this.slipGeneratedLabel = new Date().toLocaleString();
    }
  }

}
