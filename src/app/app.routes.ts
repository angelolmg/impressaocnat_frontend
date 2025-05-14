import { Routes } from '@angular/router';
import { ListSolicitationsComponent } from './pages/list-solicitations/list-solicitations.component';
import { RedirectComponent } from './pages/redirect/redirect.component';
import { ViewSolicitationComponent } from './pages/view-solicitation/view-solicitation.component';
import { PageState, pageStateRoutes } from './service/action.service';
import { SolicitationFormComponent } from './pages/solicitation-form/solicitation-form.component';
import { AllSolicitationsGuard } from './guards/all-solicitations.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		component: SolicitationFormComponent,
	},
	{
		path: pageStateRoutes[PageState.viewMySolicitations],
		children: [
			{
				path: '',
				component: ListSolicitationsComponent,
			},
			{
				path: pageStateRoutes[PageState.editSolicitation],
				component: SolicitationFormComponent,
			},
			{
				path: pageStateRoutes[PageState.viewSolicitation],
				component: ViewSolicitationComponent,
			},
		],
	},
	{
		path: pageStateRoutes[PageState.viewAllSolicitations],
		canActivate: [AllSolicitationsGuard],
		children: [
			{
				path: '',
				component: ListSolicitationsComponent,
			},
			{
				path: pageStateRoutes[PageState.editSolicitation],
				component: SolicitationFormComponent,
			},
			{
				path: pageStateRoutes[PageState.viewSolicitation],
				component: ViewSolicitationComponent,
			},
		],
	},
	{
		path: pageStateRoutes[PageState.newSolicitation],
		component: SolicitationFormComponent,
	},
	{
		path: pageStateRoutes[PageState.editSolicitation],
		component: SolicitationFormComponent,
	},
	{
		path: pageStateRoutes[PageState.viewSolicitation],
		component: ViewSolicitationComponent,
	},
	{
		path: 'redirect',
		component: RedirectComponent,
	},
	{
		path: '**',
		redirectTo: pageStateRoutes[PageState.newSolicitation],
	},
];
