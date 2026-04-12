import { Router } from 'express';
import { prisma } from '../../../outbound/database/connection.js';
import { CustomerCredentialsGateway } from '../../../outbound/database/CustomerCredentialsGateway.js';
import { LoginCustomerUseCase } from '../../../../application/auth/LoginCustomerUseCase.js';
import { AuthController } from '../controllers/AuthController.js';

const gateway = new CustomerCredentialsGateway(prisma);
const controller = new AuthController(new LoginCustomerUseCase(gateway));

const router = Router();

router.post('/', controller.loginCustomer.bind(controller));

export default router;
