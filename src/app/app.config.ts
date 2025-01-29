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
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { authInterceptor } from './guards/authInterceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideAnimationsAsync(),
		provideHttpClient(withInterceptors([authInterceptor])),
		{ provide: MatPaginatorIntl, useValue: CustomPaginator() },
		{ provide: LOCALE_ID, useValue: 'pt-BR' },
		{
			provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
			useValue: { duration: 6000 },
		},
	],
};
