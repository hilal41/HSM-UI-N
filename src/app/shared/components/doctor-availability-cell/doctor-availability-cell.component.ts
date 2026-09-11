import { Component, Input, OnChanges } from '@angular/core';
import { PopoverModule } from 'primeng/popover';
import {
  buildDoctorAvailabilityView,
  type DoctorAvailabilityView,
} from '../../utils/doctor-availability.util';

@Component({
  selector: 'app-doctor-availability-cell',
  imports: [PopoverModule],
  templateUrl: './doctor-availability-cell.component.html',
  styleUrl: './doctor-availability-cell.component.scss',
})
export class DoctorAvailabilityCellComponent implements OnChanges {
  @Input({ required: true }) availability: string | null | undefined = null;

  view: DoctorAvailabilityView = buildDoctorAvailabilityView(null);

  ngOnChanges(): void {
    this.view = buildDoctorAvailabilityView(this.availability);
  }
}
