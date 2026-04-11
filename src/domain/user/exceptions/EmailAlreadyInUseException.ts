import { AppError } from '../../../shared/errors/AppError.js';

export class EmailAlreadyInUseException extends AppError {
  constructor(email: string) {
    super(`Email already in use: ${email}`, 409);
  }
}
