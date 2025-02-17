import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCopyBoxComponent } from './add-copy-box.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('AddCopyBoxComponent', () => {
	let component: AddCopyBoxComponent;
	let fixture: ComponentFixture<AddCopyBoxComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddCopyBoxComponent],
			providers: [
				{ provide: MatDialogRef, useValue: {} },
				{ provide: MAT_DIALOG_DATA, useValue: {} },
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AddCopyBoxComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
