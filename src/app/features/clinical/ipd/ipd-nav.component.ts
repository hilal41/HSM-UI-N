import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-ipd-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './ipd-nav.component.html',
  styleUrl: './ipd-nav.component.scss',
})
export class IpdNavComponent {
  readonly tabs = [
    { route: '/app/ipd', label: 'Dashboard', exact: true },
    { route: '/app/ipd/admissions', label: 'Admissions', exact: false },
    { route: '/app/ipd/active-inpatients', label: 'Active inpatients', exact: false },
    { route: '/app/ipd/wards', label: 'Wards', exact: false },
    { route: '/app/ipd/beds', label: 'Beds', exact: false },
  ] as const;
}
