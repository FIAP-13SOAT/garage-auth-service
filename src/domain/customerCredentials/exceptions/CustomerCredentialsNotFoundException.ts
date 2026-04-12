import { AppError } from '../../../shared/errors/AppError.js';

export class CustomerCredentialsNotFoundException extends AppError {
  constructor() {
    super('Invalid credentials', 401);
  }
}
