var express = require('express');
const path = require('path');
var languageController = require('../controllers/qnalanguage.controller');
var requireAuth = require('../middlewares/verifyRequests');
var requireSourceAuth = require('../middlewares/verifySourceRequests');
// 
var customQnaController=require('../controllers/customqna.controller')
// 

var router = express.Router();

router.get('/knowledgebase', requireAuth, languageController.getQNA);
router.get('/source',requireSourceAuth, languageController.getQnAHtml);
router.post('/knowledgebase', requireAuth, languageController.chatbotqaAdd);
router.delete('/knowledgebase/:id', requireAuth, languageController.chatbotqaDelete);
router.post('/knowledgebase/deploy', requireAuth, languageController.chatbotqaUpdateSource);
router.post('/init', requireAuth, languageController.initMongoDbQNA);
router.post('/unansweredquestions/init',requireAuth,languageController.initMongoDbUNQNA)
router.post('/unansweredquestions',requireAuth,languageController.chatbotqaAddunaswered)

router.get('/uniquedpt',requireAuth,languageController.getUniqueDepartmetns)
router.get('/getqnabody',requireAuth,customQnaController.getqnabody)
module.exports = router;


