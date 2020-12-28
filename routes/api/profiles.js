const express = require('express');
const Profile = require('../../models/Profile');
const auth = require('../../middleware/auth');
const {check , validationResult } = require('express-validator');
const { route } = require('./users');
const User = require('../../models/User');

const axios = require('axios');


const config = require('config');


const router = express.Router();

//route -  @api/profile/me
//desc -   get profile of one person
//access - private
router.get('/me' , auth, async (req,res)=> {
    try{
        //fetch profile by using user field in profile model maps to this user
        //and get name and avatar from user
        const profile = await Profile.findOne({user : req.user.id}).populate('user',['name','avatar']); 
        if(!profile) {
            res.status(400).json({msg:'There is no profile for this user'});
        }
        res.json({profile}); 
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('server error!');
    }
});

 //route -  POST @api/profile
//desc -   create or update a profile
//access - private

router.post('/',
    [ 
      auth, 
      check('status','Status is required!').not().isEmpty(),
      check('skills','Skills is required!').not().isEmpty() 
    ], 
    async (req , res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        try{
           
            const {status, skills, company, website, location , bio, githubusername, youtube, facebook , instagram, twitter , linkedin} = req.body;
            
            //build profile object
            
            const profileFields = {};
            profileFields.user = req.user.id;
            if(company) profileFields.company = company;
            if(status) profileFields.status = status;
            if(website) profileFields.website = website;
            if(location) profileFields.location = location;
            if(bio) profileFields.bio = bio;
            if(githubusername) profileFields.githubusername = githubusername;

            if(skills){
                profileFields.skills =  skills.split(',').map(skill=>skill.trim());
            }

            //build social media object
            profileFields.social = {};
            if(youtube)    profileFields.social.youtube = youtube;
            if(facebook)   profileFields.social.facebook = facebook;
            if(twitter)    profileFields.social.twitter = twitter;
            if(linkedin)   profileFields.social.linkedin = linkedin;
            if(instagram)  profileFields.social.instagram = instagram;


            //get the profile 
            let profile = await Profile.findOne({user: req.user.id});

            //check if already exists if yes update or create new
            if(profile) {
            //update
               profile =  await Profile.findOneAndUpdate({user: req.user.id} , {$set: profileFields} , {new : true});    

            }else{
                //create a new one
                profile = new Profile(profileFields);
                await profile.save();
            }

            res.json({profile});

        }
        catch(err) {
            console.log(err.message);
            res.status(500).json('Server error');
        }

    });



//route -  GET @api/profile
//desc -   geT ALL PROFILES
//access - public

router.get('/',async (req,res)=>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


//route -  GET @api/profile/user/:user_id
//desc -   Get profile by user_id
//access - public

router.get('/user/:user_id',async (req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar']);
        if(!profile) {
           return  res.status(400).send('Profile not found!!');
        }
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        if(error.kind=='ObjectId') {
            return res.status(400).send('Profile not found!!');
        }
        res.status(500).send('Server error');
    }
});


//route -  DELETE @api/profile
//desc -   delete profile , user and posts
//access - private

router.delete('/', auth, async (req,res)=>{
    try {

        //@todo remove posts

        //remove profile
         await Profile.findOneAndRemove({user: req.user.id});

         //remove user
         await User.findOneAndRemove({_id : req.user.id});

         res.json({msg:'User Deleted'});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});



//route -  PUT @api/profile/experience
//desc -   Add profile experience
//access - private

router.put('/experience', 
[
    auth,
    [
    check('title','title is required').not().isEmpty(),
    check('company','company is required').not().isEmpty(),
    check('from','from is required').not().isEmpty()
    ]
], 
async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()});
    }

    const {title, company , location, from, to, current , description} = req.body;

    const newExp = {
        title:title,
        company,    //same as above if names are equal
        location,
        from,
        to,
        current,
        description
    }

    try {

        //@todo remove posts

        //remove profile
        const profile = await Profile.findOne({user: req.user.id});

        profile.experience.unshift(newExp); //same as push but adds to beginning of array

        await profile.save();

        res.json({profile});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


//route -  DELETE @api/profile/experience/:exp_id
//desc -   delete experience from profile
//access - private

router.delete('/experience/:exp_id', auth, async (req,res)=>{
    try {
         //get the profile   
          const profile = await Profile.findOne({user: req.user.id});
         
         //get the remove index of experience since its an array
         const removeIndex = profile.experience.map(exp => exp.id).indexOf(req.params.exp_id); 

         //remove the element
         profile.experience.splice(removeIndex, 1);

         await profile.save();

         res.json({profile});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


//route -  PUT @api/profile/education
//desc -   Add profile education
//access - private

router.put('/education', 
[
    auth,[
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','from is required').not().isEmpty()
    ]
], 
async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()});
    }

    const {school, degree , fieldofstudy, from, to, current , description} = req.body;

    const newEdu = {
        school:school,
        degree,    //same as above if names are equal
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {

        //remove profile
        const profile = await Profile.findOne({user: req.user.id});

        profile.education.unshift(newEdu); //same as push but adds to beginning of array

        await profile.save();

        res.json({profile});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


//route -  DELETE @api/profile/education/:edu_id
//desc -   delete education from profile
//access - private

router.delete('/education/:edu_id', auth, async (req,res)=>{
    try {
         //get the profile   
          const profile = await Profile.findOne({user: req.user.id});
         
         //get the remove index of education since its an array
         const removeIndex = profile.education.map(exp => exp.id).indexOf(req.params.edu_id); 

         //remove the element
         profile.education.splice(removeIndex, 1);

         await profile.save();

         res.json({profile});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


//route -  GET @api/profile/github/:username
//desc -   Get user repos from github
//access - public

router.get('/github/:username',async (req,res)=>{

    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
            );
            console.log(uri);    
        const headers = {
          'user-agent': 'node.js',
          Authorization: `token ${config.get('githubToken')}`
        };
    
        const gitHubResponse = await axios.get(uri, { headers });
        console.log(gitHubResponse);
        return res.json(gitHubResponse.data);
      } catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: 'No Github profile found' });
      }

});


module.exports = router;
  
