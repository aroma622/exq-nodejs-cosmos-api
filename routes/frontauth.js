// authRouter.js
var express = require('express');
var router = express.Router();

var tokenValidationCache = new Map();
const azureConfig=require('../azure.conf.json')
const passport = require('passport');
const BearerStrategy = require('passport-azure-ad').BearerStrategy;
var path = require('path');





var languageController = require('../controllers/qnalanguage.controller');
var customQnaController=require('../controllers/customqna.controller')

const options = {
    // https://login.microsoftonline.com/<your_tenant_guid>/.well-known/openid-configuration
    identityMetadata: `https://${azureConfig.metadata.authority}/${azureConfig.credentials.tenantID}/${azureConfig.metadata.version}/${azureConfig.metadata.discovery}`,
    
    /**
     * Required if you are using common endpoint and setting `validateIssuer` to true.
     * For tenant-specific endpoint, this field is optional, we will use the issuer from the metadata by default.
     * issuer: `https://${azureConfig.metadata.authority}/${azureConfig.credentials.tenantID}/${azureConfig.metadata.version}`,
     */
    // @ts-ignore
    // issuer: null,
    issuer: `https://${azureConfig.metadata.authority}/${azureConfig.credentials.tenantID}/${azureConfig.metadata.version}`,
    validateIssuer: azureConfig.settings.validateIssuer,

    clientID: azureConfig.credentials.clientID,

    audience: azureConfig.credentials.audience,

    passReqToCallback: azureConfig.settings.passReqToCallback,

    loggingLevel: azureConfig.settings.loggingLevel,

    scope: azureConfig.resource.scope,

    // If this is set to true, no personal information such as tokens and claims will be logged. The default value is true.
    loggingNoPII: false,

    /**
     * This value is the clock skew (in seconds) allowed in token validation. It must be a positive integer.
     * The default value is 300 seconds.
     */
    clockSkew: 100000
};

const bearerStrategy = new BearerStrategy(options, (token, done) => {
    // Verifying the user
    /**
      *  You can use a function here that will lookup the users and add additional information to the user
      *  object.
     **/

   
    // console.log('///////////////////////////////////////')
    // console.log('///////////////////////////////////////')
    // console.log('///////////////////////////////////////')
    const roles = token.roles || [];

    // You can now use the roles array as needed, e.g., to check for specific roles
    // console.log('User Roles:', roles);
    const user = {};
    // Send user info using the second argument
    // console.log('token', token);
    
    return done(null, user, token);
});

passport.use(bearerStrategy);

// upload file
// upload file
const multer = require('multer');
const csv = require('csv-parser');
const storage = multer.memoryStorage();  // Store file in memory
const upload = multer({ storage });

router.use(passport.initialize());

router.use(passport.authenticate('oauth-bearer', { session: false }), (req, res, next) => {
    console.log('req.authInfo', req.authInfo);
    res.locals.authInfo = req.authInfo;
    return next();
});

router.use(express.static(path.join(__dirname, '..', 'avatarfiles')));


router.get('/avatar', function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'avatarfiles', 'basicnew.html'));
});
router.get('/source', languageController.getQnAHtml);
router.post('/knowledgebase',isAdmin, languageController.chatbotqaAdd);
router.delete('/knowledgebase/:id',isAdmin, languageController.chatbotqaDelete);
router.post('/knowledgebase/deploy',isAdmin, customQnaController.chatbotqaUpdateCustomSource);

router.post('/init',isAdmin, languageController.initMongoDbQNA);

router.put('/knowledgebase',isAdmin,languageController.chatbotqaUpdate)
router.get('/knowledgebase', languageController.getQNA);
router.get('/protected',(req, res) => {
    res.send({'res':'Hello! This resource is protected.'})
}
)
router.post('/uploadcsv',isAdmin,upload.single('file'), customQnaController.uploadCSV);
// router.post('/unansweredquestions',languageController.chatbotqaAddunaswered)
router.get('/unansweredquestions',languageController.getUNQNA)
router.delete('/unansweredquestions/:id',isAdmin, languageController.chatbotunqaDelete);
router.get('/uniquedpt',isAdmin,languageController.getUniqueDepartmetns)
router.post('/updateurl',isAdmin,languageController.updateDepartmentUrl)



function isAdmin(req, res, next) {
    const roles = req.authInfo.roles || [];

    // Check if the user has the admin role
    if (roles.includes('admin')) {
        return next();
    } else {
        return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }
}


module.exports = router;

