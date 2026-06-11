import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import type { Patient } from '../../../core/models/api-contracts';
import { PatientRegisterSearchComponent } from './patient-register-search.component';
import { QuickPatientFormComponent } from './quick-patient-form.component';

type FlowMode = 'search' | 'register';

@Component({
  selector: 'app-register-patient-flow-dialog',
  imports: [ButtonModule, DialogModule, PatientRegisterSearchComponent, QuickPatientFormComponent],
  templateUrl: './register-patient-flow-dialog.component.html',
  styleUrl: './register-patient-flow-dialog.component.scss',
})
export class RegisterPatientFlowDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() patientReady = new EventEmitter<Patient>();

  mode: FlowMode = 'search';

  onVisibleChange(v: boolean): void {
    this.visible = v;
    this.visibleChange.emit(v);
    if (v) {
      this.mode = 'search';
    }
  }

  close(): void {
    this.onVisibleChange(false);
  }

  goRegisterNew(): void {
    this.mode = 'register';
  }

  backToSearch(): void {
    this.mode = 'search';
  }

  onExistingPatient(p: Patient): void {
    this.patientReady.emit(p);
    this.close();
  }

  onNewPatientSaved(p: Patient): void {
    this.patientReady.emit(p);
    this.close();
  }
}
