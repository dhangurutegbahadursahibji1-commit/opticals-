import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Wraps every successful response in a consistent envelope: { success, data, timestamp }.
// Skips wrapping if the handler already returned a { data, meta } paginated shape's
// outer keys are preserved because we spread rather than nest twice.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
