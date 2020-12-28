const jwt = require('jsonwebtoken');
const config = require('config');

const AuthFunction = (req, res, next) => {

    //get token from header
    let token = req.header('x-auth-token');

    //check token
    if(!token) {
        return res.status(401).json({msg:'No token found, Authorization denied!!'});
    }

    //verify token
    try{
        let decoded = jwt.verify(token, config.get('jswSecretKey'));
        req.user = decoded.user;
        next();
    }
    catch(err) {
        return res.status(500).json({msg: 'Token is invalid!!'});
    }

}

module.exports = AuthFunction;