const Router = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = new Router();


router.post('/registration',
 body('email').isEmail(),
 body('password').isLength({ min: 3, max: 25 }),
 userController.registration);
router.post('/login', userController.login);
router.post('/logout', authMiddleware, userController.logout);
router.get('/refresh', userController.refresh);

module.exports = router;
