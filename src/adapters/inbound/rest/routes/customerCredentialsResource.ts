import { Router } from 'express';
import { prisma } from '../../../outbound/database/connection.js';
import { CustomerCredentialsGateway } from '../../../outbound/database/CustomerCredentialsGateway.js';
import { ListCustomerCredentialsUseCase } from '../../../../application/customerCredentials/ListCustomerCredentialsUseCase.js';
import { CustomerCredentialsPresenter } from '../presenters/CustomerCredentialsPresenter.js';
import { CustomerCredentialsController } from '../controllers/CustomerCredentialsController.js';
import { requireRole } from '../middlewares/requireRole.js';
import { UserRole } from '../../../../domain/user/UserRole.js';

const gateway = new CustomerCredentialsGateway(prisma);
const presenter = new CustomerCredentialsPresenter();
const controller = new CustomerCredentialsController(
  new ListCustomerCredentialsUseCase(gateway),
  presenter,
);

const router = Router();

router.use(requireRole(UserRole.ADMIN));

router.get('/', controller.list.bind(controller));

export default router;
