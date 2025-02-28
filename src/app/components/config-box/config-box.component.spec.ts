import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfigBoxComponent } from './config-box.component';

describe('ConfigBoxComponent', () => {
	let component: ConfigBoxComponent;
	let fixture: ComponentFixture<ConfigBoxComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ConfigBoxComponent],
			providers: [
				{ provide: MatDialogRef, useValue: {} },
				{ provide: MAT_DIALOG_DATA, useValue: {} },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ConfigBoxComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
