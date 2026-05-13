import { Router } from 'express';
import { GetJwksUseCase } from '../../../../application/auth/GetJwksUseCase.js';
import { JwksController } from '../controllers/JwksController.js';

const controller = new JwksController(new GetJwksUseCase(''));

const router = Router();

router.get('/jwks.json', controller.get.bind(controller));

export default router;
