import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        code = (resp.error as string) || this.getCodeFromStatus(status);

        // Handle class-validator errors
        if (Array.isArray(resp.message)) {
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
          details = { errors: resp.message };
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Derive code from HTTP status if not set
    if (code === message || !code) {
      code = this.getCodeFromStatus(status);
    }

    const requestId = (request.headers['x-request-id'] as string) || undefined;

    const errorResponse: ErrorResponseBody = {
      error: {
        code,
        message,
        ...(details && { details }),
        ...(requestId && { requestId }),
        timestamp: new Date().toISOString(),
      },
    };

    // Log error details
    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${requestId}] ${request.method} ${request.url} ${status}: ${message}`);
    }

    response.status(status).json(errorResponse);
  }

  private getCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return statusMap[status] || 'INTERNAL_ERROR';
  }
}
