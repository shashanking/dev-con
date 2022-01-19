const config = require('config');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

const User = require('../../Model/User');
const jwt = require('jsonwebtoken');
const secret = config.get('jwtSecret');


// @route   POST api/users
// @desc    Register user
// @access  public
router.post(
    '/', 
    [
        check('name', 'Name is required')
        .not()
        .isEmpty(),
        check('email', 
        'Please include a email')
        .isEmail(),
        check('password', 
        'Password must be more than 6 digits')
        .isLength({min : 6})
        ], 
    async (req, res)=> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors : errors.array()});
        } 
        const {name, email, password} = req.body;

        try {
            //check if user exists
            let user = await User.findOne({ email });
            if(user){
                
                res.status(400).json({ errors : [{msg:"User already exists! "}]});
            }

            //fetch user gravitar
            const avatar = gravatar.url(email, {
                s : '200',
                r : 'pg',
                d : 'mm'
            });

            user = new User ({
                name,
                email,
                avatar,
                password
            });

            //encrypting password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            //return jsonWebToken
            const payload = {
                user : {
                    id : user.id
                }
            }

            jwt.sign(//header,
                payload,
                secret,
                {
                    expiresIn : 360000000000
                },
                (err, token)=>{
                    if (err) throw err;
                    res.json({token});
                }
            );
            
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }

        });

module.exports = router;