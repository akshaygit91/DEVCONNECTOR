const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const {check, valdiationResult, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jswt = require('jsonwebtoken');
const config = require('config');


const router = express.Router();

//route -  @api/auth
//desc -   test route
//access - public
router.get('/' , auth , async (req,res) => {

    //connect to DB and get the user whose id is set in auth middleware and remove password from the response
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json({user});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send('Server error');
    }


});


//validate the user and authenticate 
//POST api/auth authenticate user and get token

router.post('/',
[
    check('email','Please add a valid Email id').isEmail(),
    check('password','Password field is required').exists()
]
,
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) { 
      return res.status(400).json({errors: errors.array()});
    }

    try{

      //steps to register user
      const {email, password} = req.body;

      let user = await User.findOne({ email }); //same as {email:email}

      //check if user exists already
      if(!user) {
        return res.status(400).json({ errors:[{ msg:'Invalid Credentials'}] });
      }

    //entered password vs password stored in db
     const isMatch = await bcrypt.compare(password , user.password);
      
     if(!isMatch) {
        return res.status(400).json({ errors:[{ msg:'Invalid Credentials'}] });
     }

      //creating token once authenticated
      const payload = {
        user:{
          id:user.id
        }
      }
      jswt.sign(
        payload,
        config.get('jswSecretKey'),
        {expiresIn : 3600000},
        (err , token)=>{
          if(err){
            throw err;
          }
          res.json({ token });
        }
      );

    }
    catch(err){

      console.log(err.message);
      res.status(500).send('Server error');

    }

});




module.exports = router;

