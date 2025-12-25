import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = '';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || message;
        errors = exceptionResponse.error || '';
        
        // Handle validation pipe errors which come as an array in 'message'
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message;
          message = 'Validation failed';
        }
      } else {
        message = exceptionResponse;
      }
    } else {
      // For non-HttpExceptions, log the error or handle accordingly
      message = exception.message || message;
      console.error('Unhandled Exception:', exception);
    }

    response.status(status).json({
      data: null,
      errors: errors,
      message: message,
      status: status,
    });
  }
}
