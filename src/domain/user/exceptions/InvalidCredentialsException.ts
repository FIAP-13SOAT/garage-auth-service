import { AppError } from '../../../shared/errors/AppError.js';

export class InvalidCredentialsException extends AppError {
  constructor() {
    super('Invalid credentials', 401);
  }
}
