import { Routes } from '@angular/router';
import { EditCopyComponent } from './pages/edit-copy/edit-copy.component';
import { ListRequestsComponent } from './pages/list-requests/list-requests.component';
import { RedirectComponent } from './pages/redirect/redirect.component';
import { RequestFormComponent } from './pages/request-form/request-form.component';
import { ViewRequestComponent } from './pages/view-request/view-request.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: RequestFormComponent
    },
    {
        path: 'editar-copia',
        component: EditCopyComponent
    },
    {
        path: 'minhas-solicitacoes',
        component: ListRequestsComponent
    },
    {
        path: 'solicitacoes',
        component: ListRequestsComponent
    },
    {
        path: 'nova-solicitacao',
        component: RequestFormComponent,
    },
    {
        path: 'editar-solicitacao/:id',
        component: RequestFormComponent,
    },
    {
        path: 'ver-solicitacao/:id',
        component: ViewRequestComponent
    },
    {
        path: 'redirect',
        component: RedirectComponent
    },
    {
        path: '**',
        redirectTo: 'nova-solicitacao'
    }
];
