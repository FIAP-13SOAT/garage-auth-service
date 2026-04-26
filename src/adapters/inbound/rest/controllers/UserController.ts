import type { Request, Response, NextFunction } from 'express';
import type { CreateUserUseCase } from '../../../../application/user/CreateUserUseCase.js';
import type { UpdateUserUseCase } from '../../../../application/user/UpdateUserUseCase.js';
import type { DeleteUserUseCase } from '../../../../application/user/DeleteUserUseCase.js';
import type { ListUsersUseCase } from '../../../../application/user/ListUsersUseCase.js';
import type { UserPresenter } from '../presenters/UserPresenter.js';
import { toUUID } from '../../../../shared/types/UUID.js';

export class UserController {
  constructor(
    private readonly createUseCase: CreateUserUseCase,
    private readonly updateUseCase: UpdateUserUseCase,
    private readonly deleteUseCase: DeleteUserUseCase,
    private readonly listUseCase: ListUsersUseCase,
    private readonly presenter: UserPresenter,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.createUseCase.execute(req.body as Parameters<CreateUserUseCase['execute']>[0]);
      res.status(201).json(this.presenter.toResponse(user));
    } catch (err) {
      next(err);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.listUseCase.execute();
      res.json(this.presenter.toList(users));
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.updateUseCase.execute({
        id: toUUID(String(req.params['id'])),
        ...(req.body as object),
      });
      res.json(this.presenter.toResponse(user));
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.deleteUseCase.execute({ id: toUUID(String(req.params['id'])) });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
}
