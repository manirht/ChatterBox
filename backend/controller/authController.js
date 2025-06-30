const multer = require('multer');
const validator = require('validator');
const registerModel = require('../models/authModel');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const console = require('console');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const randNumber = Math.floor(Math.random() * 99999);
        cb(null, randNumber + file.originalname);
    }
});

const upload = multer({ storage: storage }).single('image');

module.exports.userRegister = (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error(err);
            return res.status(400).json({ error: { errorMessage: ['File upload error'] } });
        } else if (err) {
            console.error(err);
            return res.status(500).json({ error: { errorMessage: ['Internal server error'] } });
        }

        const {
            userName, email, password, confirmPassword
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: { errorMessage: ['Please provide user image'] } });
        }

        const error = [];

        if (!userName) {
            error.push('Please provide your user name');
        }
        if (!email) {
            error.push('Please provide your Email');
        }
        if (email && !validator.isEmail(email)) {
            error.push('Please provide a valid Email');
        }
        if (!password) {
            error.push('Please provide your Password');
        }
        if (!confirmPassword) {
            error.push('Please provide your confirm Password');
        }
        if (password && confirmPassword && password !== confirmPassword) {
            error.push('Your Password and Confirm Password are not the same');
        }
        if (password && password.length < 6) {
            error.push('Please provide a password of at least 6 characters');
        }

        if (error.length > 0) {
            return res.status(400).json({ error: { errorMessage: error } });
        }

        const imageName = req.file.filename;

        const newPath = path.join(__dirname, `../../frontend/public/image/${imageName}`);


        try {
            const checkUser = await registerModel.findOne({ email });

            if (checkUser) {
                return res.status(404).json({ error: { errorMessage: ['Your email already exists'] } });
            }

            fs.copyFile(req.file.path, newPath, async (copyError) => {
                if (copyError) {
                    console.error(copyError);
                    return res.status(500).json({ error: { errorMessage: ['File copy error'] } });
                }

                try {
                    const userCreate = await registerModel.create({
                        userName,
                        email,
                        password: await bcrypt.hash(password, 10),
                        image: req.file.filename
                    });

                    const token = jwt.sign({
                        id: userCreate._id,
                        email: userCreate.email,
                        userName: userCreate.userName,
                        image: userCreate.image,
                        registerTime: userCreate.createdAt
                    }, process.env.SECRET, {
                        expiresIn: process.env.TOKEN_EXP
                    });


                    const options = { expires: new Date(Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000) }

                    return res.status(201).cookie('authToken', token, options).json({
                        successMessage: 'Your Registration Was Successful',
                        token
                    });
                } catch (dbError) {
                    console.error(dbError);
                    return res.status(500).json({ error: { errorMessage: ['Database error'] } });
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: { errorMessage: ['Internal Server Error'] } });
        }
    });
};
module.exports.userLogin = async (req, res) => {
    const error = [];
    const { email, password } = req.body;
    if (!email) {
        error.push('Please provide your Email');
    }
    if (!password) {
        error.push('Please provide your Passowrd');
    }
    if (email && !validator.isEmail(email)) {
        error.push('Please provide a valid Email');
    }
    if (error.length > 0) {
        return res.status(400).json({ error: { errorMessage: error } });
    }

    try {
        const checkUser = await registerModel.findOne({ email }).select('+password');

        if (checkUser) {
            const matchPassword = await bcrypt.compare(password, checkUser.password);

            if (matchPassword) {
                const token = jwt.sign({
                    id: checkUser._id,
                    email: checkUser.email,
                    userName: checkUser.userName,
                    image: checkUser.image,
                    registerTime: checkUser.createdAt
                }, process.env.SECRET, {
                    expiresIn: process.env.TOKEN_EXP
                });

                const options = { expires: new Date(Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000) };

                return res.status(200).cookie('authToken', token, options).json({
                    successMessage: 'Your Login Successful',
                    token
                });
            } else {
                return res.status(400).json({
                    error: {
                        errorMessage: ['Your Password is not Valid']
                    }
                });
            }
        } else {
            return res.status(400).json({
                error: {
                    errorMessage: ['Your Email Not Found']
                }
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(404).json({
            error: {
                errorMessage: ['Internal Server Error']
            }
        });
    }


}

module.exports.userLogout = (req, res) => {
    res.status(200).cookie('authToken', '').json({
        success: true
    })
}




