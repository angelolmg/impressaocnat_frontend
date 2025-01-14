import { Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  constructor() { }

  saveRequest(files: any[], copies: CopyInterface[], value: number | null) {
    console.log('Uploading request...');
    console.log(typeof(files[0]));
    console.log(files);
    console.log(copies);
    console.log(value);
  }
}
