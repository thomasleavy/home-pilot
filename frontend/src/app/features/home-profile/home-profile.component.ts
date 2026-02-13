import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TemperatureUnitService } from '../../core/services/temperature-unit.service';

const STORAGE_KEY = 'mqtt-device-pilot.homeProfile';

export interface HomeProfileData {
  addressLine1?: string;
  addressLine2?: string;
  townOrCity?: string;
  eircode?: string;
  /** @deprecated use eircode (kept for loading old saved data) */
  postcode?: string;
  location?: string;
  defaultHeatingSetpoint?: number;
  preferredTempUnit?: 'C' | 'F';
}

@Component({
  selector: 'app-home-profile',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './home-profile.component.html',
  styleUrl: './home-profile.component.css',
})
export class HomeProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tempUnit = inject(TemperatureUnitService);

  form!: FormGroup;
  saved = false;

  ngOnInit(): void {
    const saved = this.loadFromStorage();
    this.form = this.fb.group({
      addressLine1: [saved?.addressLine1 ?? ''],
      addressLine2: [saved?.addressLine2 ?? ''],
      townOrCity: [saved?.townOrCity ?? ''],
      eircode: [saved?.eircode ?? saved?.postcode ?? ''],
      location: [saved?.location ?? ''],
      defaultHeatingSetpoint: [saved?.defaultHeatingSetpoint ?? null],
      preferredTempUnit: [saved?.preferredTempUnit ?? 'C'],
    });
  }

  private loadFromStorage(): HomeProfileData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as HomeProfileData;
    } catch {
      return null;
    }
  }

  save(): void {
    const value = this.form.getRawValue();
    const data: HomeProfileData = {
      addressLine1: value.addressLine1 || undefined,
      addressLine2: value.addressLine2 || undefined,
      townOrCity: value.townOrCity || undefined,
      eircode: value.eircode || undefined,
      location: value.location || undefined,
      defaultHeatingSetpoint: value.defaultHeatingSetpoint != null && value.defaultHeatingSetpoint !== '' ? Number(value.defaultHeatingSetpoint) : undefined,
      preferredTempUnit: value.preferredTempUnit || 'C',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.tempUnit.refresh();
    this.saved = true;
    setTimeout(() => (this.saved = false), 2000);
  }
}
