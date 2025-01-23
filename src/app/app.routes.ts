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
        component: ListRequestsComponent
    },
    {
        path: 'editar-copia',
        component: EditCopyComponent
    },
    {
        path: 'listar-solicitacoes',
        component: ListRequestsComponent
    },
    {
        path: 'formulario-solicitacao',
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
        redirectTo: ''
    }
];
