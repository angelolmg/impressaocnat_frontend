import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';

export const UserGuard: CanActivateFn = (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  console.log(next);
  console.log(state);

  return true;
};
