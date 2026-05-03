import type { Request, Response, NextFunction } from 'express';
import type { LoginCustomerUseCase } from '../../../../application/auth/LoginCustomerUseCase.js';
import type { LoginAdminUseCase } from '../../../../application/auth/LoginAdminUseCase.js';

export class AuthController {
  constructor(
    private readonly loginCustomerUseCase: LoginCustomerUseCase,
    private readonly loginAdminUseCase: LoginAdminUseCase,
  ) {}

  async loginCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cpfCnpj } = req.body as { cpfCnpj: string };
      const result = await this.loginCustomerUseCase.execute({ cpfCnpj });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async loginAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await this.loginAdminUseCase.execute({ email, password });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
