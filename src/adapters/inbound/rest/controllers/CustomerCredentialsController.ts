import type { Request, Response, NextFunction } from 'express';
import type { ListCustomerCredentialsUseCase } from '../../../../application/customerCredentials/ListCustomerCredentialsUseCase.js';
import type { CustomerCredentialsPresenter } from '../presenters/CustomerCredentialsPresenter.js';

export class CustomerCredentialsController {
  constructor(
    private readonly listUseCase: ListCustomerCredentialsUseCase,
    private readonly presenter: CustomerCredentialsPresenter,
  ) {}

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await this.listUseCase.execute();
      res.json(this.presenter.toList(items));
    } catch (err) {
      next(err);
    }
  }
}
