import {
	AfterViewInit,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
} from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormGroupDirective,
	FormsModule,
	NgForm,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditCopyBoxComponent } from '../../components/edit-copy-box/edit-copy-box.component';
import {
	actions,
	ActionService,
	ActionType,
	PageType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { CopyInterface } from './../../models/copy.interface';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigBoxComponent } from '../../components/config-box/config-box.component';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { NewCopyBoxComponent } from '../../components/new-copy-box/new-copy-box.component';
import { IconPipe } from '../../pipes/icon.pipe';
import { RequestService } from '../../service/request.service';

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
		MatChipsModule,
		IconPipe,
		MatProgressSpinnerModule,
	],
	templateUrl: './request-form.component.html',
	styleUrl: './request-form.component.scss',
})
export class RequestFormComponent implements AfterViewInit, OnDestroy, OnInit {
	private ngUnsubscribe = new Subject<void>();

	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);
	route = inject(ActivatedRoute);
	router = inject(Router);

	pageType = PageType.newRequest;
	pageTitle: string = PageType.newRequest;
	files: File[] = [];
	copies = new MatTableDataSource<CopyInterface>();
	allowedActions: ActionType[] = [];
	detalhes = ActionType.DETALHES;

	fileCount = signal(0);
	requestPageCounter = signal(0);
	times: number[] = [48, 24, 12, 4, 2];
	selectedTermControl = new FormControl(environment.DEFAULT_TERM_VALUE);
	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'pageConfig',
		'actions',
	];
	editRequestId: number | undefined;
	uploading = signal(false);
	loadingData = signal(false);

	public get editRequest(): PageType {
		return PageType.editRequest;
	}

	ngOnInit(): void {
		// Definir tipo de formulário: edição ou criação
		let url = this.route.snapshot.url[0];
		this.pageType =
			url && url.path == 'editar'
				? PageType.editRequest
				: PageType.newRequest;
		if (this.pageType == PageType.editRequest) {
			this.editRequestId = +this.route.snapshot.paramMap.get('id')!;
			this.pageTitle =
				this.pageType +
				' Nº ' +
				this.editRequestId.toString().padStart(6, '0');
			this.loadingData.set(true);
			this.requestService
				.getRequestById(this.editRequestId)
				.pipe(
					finalize(() => {
						this.loadingData.set(false);
					})
				)
				.subscribe((request) => {
					this.copies.data = request.copies!;
					this.selectedTermControl.setValue(request.term / (60 * 60));
					this.refreshTable();
				});
		}
	}

	ngAfterViewInit(): void {
		// Definir ações permitidas nos formulários, a depender do tipo de página
		if (this.pageType == PageType.newRequest)
			this.allowedActions = actions.allowedActionsforNewRequest;
		else this.allowedActions = actions.allowedActionsforEditRequest;

		// Observar eventos de deleção e edição

		this.actionService.deleteCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.removeCopy(copy);
			});

		this.actionService.editCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.editCopyDialog(copy);
			});
	}

	removeCopy(copy: CopyInterface) {
		// Apenas tente deletar uma solicitação durante uma edição, caso o usuário tente remover a última cópia
		let isLastCopy =
			this.pageType == this.editRequest && this.copies.data.length == 1;
		let lastCopyMessage = isLastCopy
			? 'Esta é a única cópia e a solicitação também será excluída. '
			: '';

		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir cópia',
				message:
					"Deseja realmente excluir cópia de '" +
					copy.fileName +
					"'?",
				warning: lastCopyMessage + 'Esta ação é permanente',
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.subscribe((shouldRemove: boolean) => {
				if (!shouldRemove) return;

				if (isLastCopy) {
					this.requestService
						.removeRequestById(this.editRequestId!)
						.subscribe((response) => {
							this._snackBar.open(response.message, 'Ok');
							this.router.navigate([
								this.actionService.getLastPageState(true) ||
									'nova-solicitacao',
							]);
						});
				} else {
					const copyIndex = this.copies.data.indexOf(copy);

					if (copyIndex >= 0) {
						this.copies.data.splice(copyIndex, 1);
						this.files.splice(copyIndex, 1);

						this.refreshTable();
					}
				}
			});
	}

	/**
	 * Retorna o índice de uma cópia existente com o mesmo nome e intervalos de página na lista de cópias anexadas.
	 * Se não existir uma cópia correspondente, retorna -1.
	 *
	 * @param name - O nome do arquivo para comparar
	 * @param pageIntervals - A string de intervalos de página para comparar
	 * @param index - O índice da cópia sendo editada (se aplicável)
	 * @param editing - Se estamos no modo de edição
	 * @param relativePosition - A posição da cópia sendo editada
	 * @returns O índice da cópia correspondente ou -1 se nenhuma correspondência for encontrada
	 */
	private findExistingCopyIndex(
		name: string,
		pageIntervals?: string,
		index?: number,
		editing?: boolean,
		relativePosition?: number
	): number {
		const copies: CopyInterface[] = this.copies.data;

		for (let i = 0; i < copies.length; i++) {
			const currCopy = copies[i];

			// Verifica se os nomes correspondem
			const namesMatch = currCopy.fileName === name;

			// Verifica se os intervalos de página correspondem (ou ambos são iguais ou ambos são undefined/null)
			const intervalsMatch =
				currCopy.printConfig.pageIntervals === pageIntervals ||
				(!currCopy.printConfig.pageIntervals && !pageIntervals);

			if (namesMatch && intervalsMatch) {
				// Se não estiver no modo de edição, encontramos uma correspondência
				if (!editing) {
					return i;
				}

				// Lida com a lógica de edição com casos especiais
				const samePosition = i === relativePosition;
				const bothHaveIds = index && currCopy.id;
				const neitherHaveIds = !index && !currCopy.id;
				const mixedIdStatus =
					(index && !currCopy.id) || (!index && currCopy.id);

				if ((bothHaveIds || neitherHaveIds) && samePosition) {
					return -1; // Mesma posição, então é o item sendo editado
				}

				if (bothHaveIds || neitherHaveIds || mixedIdStatus) {
					return i;
				}
			}
		}

		return -1; // Nenhuma correspondência encontrada
	}

	editCopyDialog(copy: CopyInterface) {
		this.dialogService
			.openDialog(EditCopyBoxComponent, {
				title: 'Editar cópia',
				data: copy,
				positive_label: 'Confirmar',
				negative_label: 'Cancelar',
			})
			.afterClosed()
			.subscribe((result: FormGroup) => {
				if (result) {
					const editedParts = result.value;

					// Caso exista, formatar intervalo de páginas (string) para sempre ter UM espaço depois da vírgula ", " (padrão)
					let interval = editedParts.pageIntervals;
					if (interval)
						editedParts.pageIntervals = interval.replace(
							/,\s*/g,
							', '
						);

					const copyIndex = this.copies.data.indexOf(copy);
					// Função de atualização de cópia
					const updateCopy = (indexToRemove?: number) => {
						if (copyIndex >= 0) {
							// Atualize as observações, remova do objeto temporario
							this.copies.data[copyIndex].notes =
								editedParts.notes;
							delete editedParts.notes;

							// Atualize configurações de impressão
							this.copies.data[copyIndex].printConfig = {
								...this.copies.data[copyIndex].printConfig,
								...editedParts,
							};

							if (
								this.copies.data[copyIndex].printConfig
									.pages === 'Todas'
							)
								this.copies.data[
									copyIndex
								].printConfig.pageIntervals = undefined;
						}

						if (indexToRemove != undefined) {
							this.copies.data.splice(indexToRemove, 1);
							this.files.splice(indexToRemove, 1);
						}

						this.refreshTable();
					};

					// Encontrar cópia repetida, caso exista
					const existingCopyIndex = this.findExistingCopyIndex(
						copy.fileName,
						editedParts.pageIntervals,
						copy.id,
						true,
						copyIndex
					);

					// Função manipuladora de cópias durante edição
					// Pode: atualizar OU atualizar remover cópia repetida
					const processCopy = () => {
						if (existingCopyIndex !== -1) {
							let copy = this.copies.data[existingCopyIndex];
							this.dialogService
								.openDialog(DialogBoxComponent, {
									title: 'Sobreescrever cópia',
									message: `Já existe uma cópia com o nome '${
										copy.fileName
									}'${
										copy.printConfig.pageIntervals
											? " e mesmo intervalo '" +
											  copy.printConfig.pageIntervals +
											  "'"
											: ''
									} nesta solicitação. Deseja sobreescrever?`,
									warning: 'Esta ação é permanente',
									positive_label: 'Sim',
									negative_label: 'Não',
								})
								.afterClosed()
								.subscribe((shouldRewrite: boolean) => {
									// Atualizar removendo cópia repetida
									// Somente após confirmação do usuário
									if (shouldRewrite)
										updateCopy(existingCopyIndex);
								});
						} else {
							updateCopy();
						}
					};
					processCopy();
				}
			});
	}

	addCopyDialog(data?: CopyInterface) {
		this.dialogService
			.openDialog(
				NewCopyBoxComponent,
				{
					data: data,
					positive_label: 'Finalizar',
				},
				true
			)
			.afterClosed()
			.subscribe((result: CopyInterface | null) => {
				if (!result) return;

				if (!result.isPhysicalFile && !result.file) {
					let msg = 'Erro: Nenhum arquivo anexado.';
					this._snackBar.open(msg, 'Ok');
					console.error(msg);
					return;
				}

				// Caso exista, formatar intervalo de páginas (string) para sempre ter UM espaço depois da vírgula ", " (padrão)
				let interval = result.printConfig.pageIntervals;
				if (interval)
					result.printConfig.pageIntervals = interval.replace(
						/,\s*/g,
						', '
					);

				// Encontrar cópia repetida, caso exista
				const existingCopyIndex = this.findExistingCopyIndex(
					result.file.name,
					result.printConfig.pageIntervals
				);

				const addOrUpdateCopy = (index?: number) => {
					if (index !== undefined) {
						this.copies.data[index] = result;
						this.files[index] = result.file;
					} else {
						this.copies.data.push(result);
						this.files.push(result.file);
					}
					this.refreshTable();
				};

				const processCopy = () => {
					if (existingCopyIndex !== -1) {
						let copy = this.copies.data[existingCopyIndex];
						this.dialogService
							.openDialog(DialogBoxComponent, {
								title: 'Sobreescrever cópia',
								message: `Já existe uma cópia com o nome '${
									copy.fileName
								}'${
									copy.printConfig.pageIntervals
										? " e mesmo intervalo '" +
										  copy.printConfig.pageIntervals +
										  "'"
										: ''
								} nesta solicitação. Deseja sobreescrever?`,
								warning: 'Esta ação é permanente',
								positive_label: 'Sim',
								negative_label: 'Não',
							})
							.afterClosed()
							.subscribe((shouldRewrite: boolean) => {
								if (shouldRewrite)
									addOrUpdateCopy(existingCopyIndex);
								else this.addCopyDialog(result);
							});
					} else {
						addOrUpdateCopy();
					}
				};
				processCopy();
			});
	}

	clearCopiesDialog() {
		if (this.anyCopies()) {
			this.dialogService
				.openDialog(DialogBoxComponent, {
					title: 'Limpar Cópias',
					message: `Deseja realmente excluir todas as [${this.copies.data.length}] cópias anexadas?`,
					warning: 'Esta ação é permanente',
					positive_label: 'Sim',
					negative_label: 'Não',
				})
				.afterClosed()
				.subscribe((result: boolean) => {
					if (result) this.clearCopies();
				});
		}
	}

	showConfigs(copy: CopyInterface) {
		this.dialogService.openDialog(ConfigBoxComponent, {
			title: 'Configurações de Impressão',
			data: copy,
			positive_label: 'Ok',
		});
	}

	clearCopies() {
		this.copies.data = [];
		this.files = [];
		this.selectedTermControl.setValue(environment.DEFAULT_TERM_VALUE);

		this.refreshTable();
	}

	refreshTable() {
		// Atualizar objeto data source de cópias da tabela
		// Angular Material is weird
		this.copies.data = this.copies.data;

		this.fileCount.set(this.copies.data.length);

		// Refresh total page counter of the request
		var counter = 0;
		this.copies.data.forEach((copy) => {
			counter += copy.printConfig.sheetsTotal;
		});

		this.requestPageCounter.set(counter);
	}

	submitRequest() {
		let sub: Observable<any> = new Observable<any>();

		switch (this.pageType) {
			case PageType.newRequest:
				if (this.anyCopies() && this.files.length > 0) {
					this.uploading.set(true);

					sub = this.requestService.saveRequest(
						this.files,
						this.copies.data,
						this.selectedTermControl.value || 24, // Default 24h de prazo
						this.requestPageCounter()
					);
				} else {
					this._snackBar.open(
						'É necessário adicionar pelo menos uma cópia à solicitação',
						'Ok'
					);
				}
				break;
			case PageType.editRequest:
				this.uploading.set(true);
				sub = this.requestService.editRequest(
					this.editRequestId!,
					this.files,
					this.copies.data,
					this.selectedTermControl.value || 24,
					this.requestPageCounter()
				);
				break;
		}

		sub.pipe(
			finalize(() => {
				this.uploading.set(false);
			})
		).subscribe({
			next: (response) => {
				this._snackBar.open(
					'Cadastro bem sucedido (ID: ' +
						response.id.toString().padStart(6, '0') +
						')',
					'Ok'
				);
				this.clearCopies();
				this.router.navigate([this.getLastPageState(true) || 'minhas-solicitacoes']);
			},
			error: (err) => {
				console.error(err);
				this._snackBar.open(err, 'Ok');
			},
		});
	}

	anyCopies() {
		return this.copies.data.length > 0;
	}

	getLastPageState(asRoute?: boolean): string | null {
		return this.actionService.getLastPageState(asRoute);
	}

	navigateTo(route: string | null) {
		if (route) this.router.navigate([route]);
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
