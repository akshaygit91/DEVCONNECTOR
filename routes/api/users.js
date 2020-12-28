const express = require('express');
const {check,  validationResult} = require('express-validator');
const gravatar = require('gravatar');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jswt = require('jsonwebtoken');
const router = express.Router();

const config = require('config');
const { json } = require('express');

//route -  post @api/users
//desc -   test routeRegister user
//ACCESS  - public

router.post('/',
[ 
    check('name','Name is required').not().isEmpty(),
    check('email','Please add a valid Email id').isEmail(),
    check('password','Please enter password with min of 6 characters').isLength({min:6})
]
,
async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()) { 
      return res.status(400).json({errors: errors.array()});
    }

    try{

      //steps to register user
      const {name, email, password} = req.body;

      let user = await User.findOne({ email }); //same as {email:email}

      //check if user exists already
      if(user) {
        return res.status(400).json({ errors:[{ msg:'User already exists'}] });
      }

      //get users gravatar
      const avatar = gravatar.url(email ,{
        s:'200',
        r:'pg',
        d:'mm'
      })

      //create a new obj to save in db
      user = new User({
        name,
        email,
        avatar,
        password
      });

      //encrypt password

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password,salt);

      //save to db
      await user.save();

      //return jsonwebtoken
      let payload = {
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