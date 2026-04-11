import { Router } from 'express';
import { prisma } from '../../../outbound/database/connection.js';
import { UserGatewayImpl } from '../../../outbound/database/UserGateway.js';
import { CreateUserUseCase } from '../../../../application/user/CreateUserUseCase.js';
import { UpdateUserUseCase } from '../../../../application/user/UpdateUserUseCase.js';
import { DeleteUserUseCase } from '../../../../application/user/DeleteUserUseCase.js';
import { ListUsersUseCase } from '../../../../application/user/ListUsersUseCase.js';
import { UserPresenter } from '../presenters/UserPresenter.js';
import { UserController } from '../controllers/UserController.js';

const gateway = new UserGatewayImpl(prisma);
const presenter = new UserPresenter();
const controller = new UserController(
  new CreateUserUseCase(gateway),
  new UpdateUserUseCase(gateway),
  new DeleteUserUseCase(gateway),
  new ListUsersUseCase(gateway),
  presenter,
);

const router = Router();

router.post('/', controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
