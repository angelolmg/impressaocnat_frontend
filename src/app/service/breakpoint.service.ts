import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class BreakpointService {
	private readonly breakpointObserver = inject(BreakpointObserver);

	private readonly layoutChanges = toSignal(
		this.breakpointObserver.observe(Object.values(Breakpoints)).pipe(
			map(({ breakpoints }) => breakpoints),
			tap((breakpoints) =>
				console.log('Breakpoint changes:', breakpoints)
			)
		)
	);

	public readonly isWeb = computed(() => {
		return (
			this.layoutChanges()?.[
				'(min-width: 1280px) and (orientation: landscape)'
			] ?? false
		);
	});
}
