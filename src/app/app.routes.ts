import { Routes } from '@angular/router';
import { ListRequestsComponent } from './pages/list-requests/list-requests.component';
import { RedirectComponent } from './pages/redirect/redirect.component';
import { RequestFormComponent } from './pages/request-form/request-form.component';
import { ViewRequestComponent } from './pages/view-request/view-request.component';
import { pageTypeRoutes, PageType } from './service/action.service';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: RequestFormComponent
    },
    {
        path: pageTypeRoutes[PageType.viewMyRequests],
        children: [
            {
                path: '',
                component: ListRequestsComponent,
            },
            {
                path: pageTypeRoutes[PageType.editRequest],
                component: RequestFormComponent,
            },
            {
                path: pageTypeRoutes[PageType.viewRequest],
                component: ViewRequestComponent
            },
        ]
    },
    {
        path: pageTypeRoutes[PageType.viewAllRequests],
        children: [
            {
                path: '',
                component: ListRequestsComponent,
            },
            {
                path: pageTypeRoutes[PageType.editRequest],
                component: RequestFormComponent,
            },
            {
                path: pageTypeRoutes[PageType.viewRequest],
                component: ViewRequestComponent
            },
        ]
    },
    {
        path: pageTypeRoutes[PageType.newRequest],
        component: RequestFormComponent,
    },
    {
        path: pageTypeRoutes[PageType.editRequest],
        component: RequestFormComponent,
    },
    {
        path: pageTypeRoutes[PageType.viewRequest],
        component: ViewRequestComponent
    },
    {
        path: 'redirect',
        component: RedirectComponent
    },
    {
        path: '**',
        redirectTo: pageTypeRoutes[PageType.newRequest]
    }
];
