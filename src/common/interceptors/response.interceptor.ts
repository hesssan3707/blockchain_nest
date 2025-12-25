import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  errors: string;
  message: string;
  status: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If data is already in the final format, don't wrap it again
        if (data && typeof data === 'object' && 'status' in data && 'data' in data && 'message' in data) {
          return data;
        }

        return {
          data: data ?? null,
          errors: '',
          message: 'Operation successful',
          status: statusCode,
        };
      }),
    );
  }
}
