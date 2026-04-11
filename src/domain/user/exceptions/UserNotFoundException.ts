import { AppError } from '../../../shared/errors/AppError.js';

export class UserNotFoundException extends AppError {
  constructor(id: string) {
    super(`User not found: ${id}`, 404);
  }
}
