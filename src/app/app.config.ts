import {
	ApplicationConfig,
	LOCALE_ID,
	provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginator } from './configs/paginator.config';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideAnimationsAsync(),
		{ provide: MatPaginatorIntl, useValue: CustomPaginator() },
		{ provide: LOCALE_ID, useValue: 'pt-BR' },
	],
};
