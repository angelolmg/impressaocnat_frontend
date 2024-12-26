import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Option {
  image: string
  text: string
  routerLink: string
}

interface User {
  id: string
  name: string
}

@Component({
  selector: 'app-side-menu',
  imports: [RouterLink],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {

  user: User = {
    'id': '123456',
    'name': 'Fulano de Tal'
  }

  options: Option[] = [
    {
      'image': 'assets/upload-02.svg',
      'text': 'Nova Solicitação',
      'routerLink': 'formulario-solicitacao'
    },
    {
      'image': 'assets/listing-02.svg',
      'text': 'Minhas Solicitações',
      'routerLink': 'listar-solicitacoes'
    },
    {
      'image': 'assets/listing-02.svg',
      'text': 'Todas as Solicitações',
      'routerLink': 'listar-solicitacoes'
    }
  ]
}
