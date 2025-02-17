import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginBoxComponent } from './login-box.component';
import { MatDialogRef, MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { DialogService } from '../../service/dialog.service';

describe('LoginBoxComponent', () => {
	let component: LoginBoxComponent;
	let fixture: ComponentFixture<LoginBoxComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LoginBoxComponent],
			providers: [
        { provide: MatDialogRef,useValue: {} },
        { provide: MAT_DIALOG_DATA,useValue: {} },
				provideHttpClient(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(LoginBoxComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
