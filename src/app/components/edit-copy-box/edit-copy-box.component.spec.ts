import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCopyBoxComponent } from './edit-copy-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('EditCopyBoxComponent', () => {
	let component: EditCopyBoxComponent;
	let fixture: ComponentFixture<EditCopyBoxComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [EditCopyBoxComponent],
			providers: [
				{ provide: MatDialogRef, useValue: {} },
				{ provide: MAT_DIALOG_DATA, useValue: {} },
        provideAnimationsAsync()
			],
		}).compileComponents();

		fixture = TestBed.createComponent(EditCopyBoxComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
