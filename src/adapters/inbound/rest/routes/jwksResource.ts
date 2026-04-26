import { Router } from 'express';
import { env } from '../../../../shared/config/env.js';
import { GetJwksUseCase } from '../../../../application/auth/GetJwksUseCase.js';
import { JwksController } from '../controllers/JwksController.js';

const controller = new JwksController(new GetJwksUseCase(env.jwt.publicKey));

const router = Router();

router.get('/jwks.json', controller.get.bind(controller));

export default router;
