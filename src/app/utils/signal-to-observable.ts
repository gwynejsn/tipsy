
import { effect, Signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export function signalToObservable<T>(signal: Signal<T>): Observable<T> {
  const subject = new Subject<T>();
  effect(() => {
    subject.next(signal());
  });
  return subject.asObservable();
}
