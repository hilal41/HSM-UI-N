import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import type { CreateMedicineRequest, Medicine, UpdateMedicineRequest } from '../../../core/models/api-contracts';
import { MEDICINE_CATEGORY_OPTIONS, MEDICINE_FORM_OPTIONS, MEDICINE_SELECT_OTHER } from './medicine-lookups';
import {
  categoryToSelectValue,
  formToSelectValue,
  parseIsoDateLocal,
  resolveOtherSelect,
  toLocalIsoDate,
} from './medicine-form.utils';

@Component({
  selector: 'app-medicine-form-dialog',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ToggleSwitchModule,
  ],
  templateUrl: './medicine-form-dialog.component.html',
  styleUrl: './medicine-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineFormDialogComponent {
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Two-way: dialog visibility. */
  readonly visible = model(false);
  readonly saving = input(false);
  /** `null` = create; otherwise edit that row. */
  readonly record = input<Medicine | null>(null);

  readonly submitCreate = output<CreateMedicineRequest>();
  readonly submitUpdate = output<{ id: number; body: UpdateMedicineRequest }>();

  readonly categoryOptions = [...MEDICINE_CATEGORY_OPTIONS];
  readonly formOptions = [...MEDICINE_FORM_OPTIONS];
  readonly otherSentinel = MEDICINE_SELECT_OTHER;

  medicineName = '';
  genericName = '';
  code = '';
  categorySelect = '';
  categoryOther = '';
  formSelect = '';
  formOther = '';
  strength = '';
  manufacturer = '';
  purchasePrice: number | null = null;
  salePrice: number | null = null;
  batchNumber = '';
  expiryDate: Date | null = null;
  description = '';
  isActive = true;
  barcode = '';
  qrCode = '';
  hsnCode = '';
  taxPercent: number | null = null;
  brand = '';
  genericStrength = '';
  storageTemperature = '';
  controlledDrugClass = '';
  purchaseUnit = '';
  saleUnit = '';

  constructor() {
    effect(() => {
      const open = this.visible();
      const rec = this.record();
      if (!open) return;
      untracked(() => {
        this.patchFromRecord(rec);
        this.cdr.markForCheck();
      });
    });
  }

  onHide(): void {
    this.visible.set(false);
  }

  save(): void {
    const cat = resolveOtherSelect(this.categorySelect, this.categoryOther);
    const form = resolveOtherSelect(this.formSelect, this.formOther);
    if (!this.medicineName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Medicine name is required.' });
      return;
    }
    if (!this.code.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
      return;
    }
    if (!cat) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Category is required.' });
      return;
    }
    if (!form) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Form is required.' });
      return;
    }
    if (this.categorySelect === MEDICINE_SELECT_OTHER && !this.categoryOther.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Enter a category when Other is selected.' });
      return;
    }
    if (this.formSelect === MEDICINE_SELECT_OTHER && !this.formOther.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Enter a form when Other is selected.' });
      return;
    }

    const expiryIso = this.expiryDate ? toLocalIsoDate(this.expiryDate) : null;
    const base = {
      medicineName: this.medicineName.trim(),
      genericName: this.genericName.trim() || null,
      code: this.code.trim(),
      category: cat,
      form,
      strength: this.strength.trim() || null,
      manufacturer: this.manufacturer.trim() || null,
      purchasePrice: this.purchasePrice,
      salePrice: this.salePrice,
      batchNumber: this.batchNumber.trim() || null,
      expiryDate: expiryIso,
      description: this.description.trim() || null,
      barcode: this.barcode.trim() || null,
      qrCode: this.qrCode.trim() || null,
      hsnCode: this.hsnCode.trim() || null,
      taxPercent: this.taxPercent,
      brand: this.brand.trim() || null,
      genericStrength: this.genericStrength.trim() || null,
      storageTemperature: this.storageTemperature.trim() || null,
      controlledDrugClass: this.controlledDrugClass.trim() || null,
      purchaseUnit: this.purchaseUnit.trim() || null,
      saleUnit: this.saleUnit.trim() || null,
      isActive: this.isActive,
    } satisfies Omit<CreateMedicineRequest, 'hospitalId'>;

    const rec = this.record();
    if (rec == null) {
      this.submitCreate.emit({ ...base });
    } else {
      this.submitUpdate.emit({ id: rec.id, body: base });
    }
  }

  private patchFromRecord(rec: Medicine | null): void {
    if (rec == null) {
      this.medicineName = '';
      this.genericName = '';
      this.code = '';
      this.categorySelect = this.categoryOptions[0]?.value ?? '';
      this.categoryOther = '';
      this.formSelect = this.formOptions[0]?.value ?? '';
      this.formOther = '';
      this.strength = '';
      this.manufacturer = '';
      this.purchasePrice = null;
      this.salePrice = null;
      this.batchNumber = '';
      this.expiryDate = null;
      this.description = '';
      this.isActive = true;
      this.barcode = '';
      this.qrCode = '';
      this.hsnCode = '';
      this.taxPercent = null;
      this.brand = '';
      this.genericStrength = '';
      this.storageTemperature = '';
      this.controlledDrugClass = '';
      this.purchaseUnit = '';
      this.saleUnit = '';
      return;
    }

    this.medicineName = rec.medicineName;
    this.genericName = rec.genericName ?? '';
    this.code = rec.code;
    this.categorySelect = categoryToSelectValue(rec.category);
    this.categoryOther = this.categorySelect === MEDICINE_SELECT_OTHER ? rec.category : '';
    this.formSelect = formToSelectValue(rec.form);
    this.formOther = this.formSelect === MEDICINE_SELECT_OTHER ? rec.form : '';
    this.strength = rec.strength ?? '';
    this.manufacturer = rec.manufacturer ?? '';
    this.purchasePrice = rec.purchasePrice ?? null;
    this.salePrice = rec.salePrice ?? null;
    this.batchNumber = rec.batchNumber ?? '';
    this.expiryDate = rec.expiryDate ? parseIsoDateLocal(rec.expiryDate) : null;
    this.description = rec.description ?? '';
    this.isActive = rec.isActive;
    this.barcode = rec.barcode ?? '';
    this.qrCode = rec.qrCode ?? '';
    this.hsnCode = rec.hsnCode ?? '';
    this.taxPercent = rec.taxPercent ?? null;
    this.brand = rec.brand ?? '';
    this.genericStrength = rec.genericStrength ?? '';
    this.storageTemperature = rec.storageTemperature ?? '';
    this.controlledDrugClass = rec.controlledDrugClass ?? '';
    this.purchaseUnit = rec.purchaseUnit ?? '';
    this.saleUnit = rec.saleUnit ?? '';
  }
}
