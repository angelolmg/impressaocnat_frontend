import { Routes } from '@angular/router';
import { ListRequestsComponent } from './pages/list-requests/list-requests.component';
import { RedirectComponent } from './pages/redirect/redirect.component';
import { RequestFormComponent } from './pages/request-form/request-form.component';
import { ViewRequestComponent } from './pages/view-request/view-request.component';
import { PageState, pageStateRoutes } from './service/action.service';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		component: RequestFormComponent,
	},
	{
		path: pageStateRoutes[PageState.viewMyRequests],
		children: [
			{
				path: '',
				component: ListRequestsComponent,
			},
			{
				path: pageStateRoutes[PageState.editRequest],
				component: RequestFormComponent,
			},
			{
				path: pageStateRoutes[PageState.viewRequest],
				component: ViewRequestComponent,
			},
		],
	},
	{
		path: pageStateRoutes[PageState.viewAllRequests],
		children: [
			{
				path: '',
				component: ListRequestsComponent,
			},
			{
				path: pageStateRoutes[PageState.editRequest],
				component: RequestFormComponent,
			},
			{
				path: pageStateRoutes[PageState.viewRequest],
				component: ViewRequestComponent,
			},
		],
	},
	{
		path: pageStateRoutes[PageState.newRequest],
		component: RequestFormComponent,
	},
	{
		path: pageStateRoutes[PageState.editRequest],
		component: RequestFormComponent,
	},
	{
		path: pageStateRoutes[PageState.viewRequest],
		component: ViewRequestComponent,
	},
	{
		path: 'redirect',
		component: RedirectComponent,
	},
	{
		path: '**',
		redirectTo: pageStateRoutes[PageState.newRequest],
	},
];
