import { Router } from 'express';
import { prisma } from '../../../outbound/database/connection.js';
import { CustomerCredentialsGateway } from '../../../outbound/database/CustomerCredentialsGateway.js';
import { UserGatewayImpl } from '../../../outbound/database/UserGateway.js';
import { LoginCustomerUseCase } from '../../../../application/auth/LoginCustomerUseCase.js';
import { LoginAdminUseCase } from '../../../../application/auth/LoginAdminUseCase.js';
import { AuthController } from '../controllers/AuthController.js';

const customerGateway = new CustomerCredentialsGateway(prisma);
const userGateway = new UserGatewayImpl(prisma);
const controller = new AuthController(
  new LoginCustomerUseCase(customerGateway),
  new LoginAdminUseCase(userGateway),
);

const router = Router();

router.post('/login', controller.loginCustomer.bind(controller));
router.post('/admin/login', controller.loginAdmin.bind(controller));

export default router;
