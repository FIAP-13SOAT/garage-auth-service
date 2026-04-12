import type { Request, Response, NextFunction } from 'express';
import type { LoginCustomerUseCase } from '../../../../application/auth/LoginCustomerUseCase.js';

export class AuthController {
  constructor(private readonly loginCustomerUseCase: LoginCustomerUseCase) {}

  async loginCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cpfCnpj } = req.body as { cpfCnpj: string };
      const result = await this.loginCustomerUseCase.execute({ cpfCnpj });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
