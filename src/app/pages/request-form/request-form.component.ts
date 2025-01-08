import { AfterViewInit, Component } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COPY_DATA, CopyInterface } from '../../models/copy.interface';
import { RequestInterface } from '../../models/request.interface';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
	isErrorState(
		control: FormControl | null,
		form: FormGroupDirective | NgForm | null
	): boolean {
		const isSubmitted = form && form.submitted;
		return !!(
			control &&
			control.invalid &&
			(control.dirty || control.touched || isSubmitted)
		);
	}
}

@Component({
	selector: 'app-request-form',
	imports: [
		MatButton,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
		MatTableModule,
		MatIconModule,
		MatTooltipModule,
		MatButtonModule,
		MatSelectModule,
    MatChipsModule
	],
	templateUrl: './request-form.component.html',
	styleUrl: './request-form.component.scss',
})
export class RequestFormComponent implements AfterViewInit{
  ngAfterViewInit(): void {
    console.log(this.dataSource);
  }
  
	selectedFile: any = null;
	dataSource = new MatTableDataSource<CopyInterface>(COPY_DATA);

	times: number[] = [48, 24, 12, 4, 2, 1];

	displayedColumns: string[] = [
		'file_name',
		'page_count',
		'copy_count',
		'actions',
	];

	copyNumFormControl = new FormControl('', [
		Validators.required,
		Validators.min(1),
	]);

	matcher = new MyErrorStateMatcher();

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0] ?? null;
		console.log(this.selectedFile);
	}

	checkDisabled(action: string, element: RequestInterface) {
		if (element.conclusion_date) {
			if (action == 'Concluir' || action == 'Editar') {
				return true;
			}
		}
		return false;
	}

  removeCopy(index: CopyInterface){
    this.dataSource.data = this.dataSource.data.filter(item => item != index);
  }
}
