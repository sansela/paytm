const express = require('express');
const zod = require('zod');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config.js');
const { User, Account } = require('../db.js');
const { authMiddleware } = require('../middleware.js');

router.post('/signup', async (req, res) => {
    try {
        const signupSchema = zod.object({
            username: zod.string().email(),
            password: zod.string(),
            firstName: zod.string(),
            lastName: zod.string()
        });
        const { success } = signupSchema.safeParse(req.body);

        if (!success) {
            return res.status(411).json({
                message: "Input validation failed"
            })
        }
        const { username, password, firstName, lastName } = req.body;

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already taken/ incorrect Inputs"
            })
        }

        const user = await User.create({
            username,
            password,
            firstName,
            lastName
        })

        if (user) {
            const userId = user._id;
            const account = await Account.create({
                userId,
                balance: 1 + Math.floor(Math.random() * 10000)
            })
            const token = jwt.sign({ userId }, JWT_SECRET);
            res.json({
                message: "User create successfully",
                balance: account.balance,
                token: token
            })
        }
    } catch (error) {
        console.log('Error creating user', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

router.post('/signin', async (req, res) => {

    try {
        const signInSchema = zod.object({
            username: zod.string(),
            password: zod.string()
        });

        const { success } = signInSchema.safeParse(req.body);
        if (!success) {
            return res.status(411).json({
                message: "username or password is not valid"
            })
        }

        const { username, password } = req.body;
        const user = await User.findOne({ username, password });

        if (user) {
            const userId = user._id;
            const token = jwt.sign({ userId }, JWT_SECRET)
            return res.status(200).json({ token: token });
        }
        res.status(411).json({
            message: "Error while loggin in"
        })
    } catch (error) {
        console.log('Error while logging In', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
})

router.put('/', authMiddleware, async (req, res) => {
    try {
        const updateUserSchema = zod.object({
            password: zod.string(),
            firstName: zod.string(),
            lastName: zod.string()
        })
        const success = updateUserSchema.safeParse(updateUserSchema);
        if (!success) {
            res.status(411).json({
                message: "Iput validation Error"
            });
        }
        const userId = req.userId;
        const { password, firstName, lastName } = req.body;
        const updateUser = await User.findOneAndUpdate({ _id: userId }, { password, firstName, lastName });
        if (updateUser) {
            return res.status(200).json({
                message: "Updated Successfully"
            })
        }
        res.status(411).json({
            message: "Error while updating the information"
        });
    } catch (error) {
        console.log("Error while updating user info", error)
        res.status(500).json({
            message: "Internal Server Error"
        });
    }

})


router.get('/bulk', authMiddleware, async (req, res) => {
    try {
        const name = req.query.filter;
        console.log('query param:', name);
        const users = await User.find({ $or: [{ firstName: { $regex: name } }, { lastName: { $regex: name } }] });
        console.log(users);

        if (users) {
            return res.status(200).json({
                users: users.map((user) => ({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    _id: user._id
                }))
            });
        }
        res.status(411).json({
            message: "No users found"
        })
    } catch (error) {
        console.log('Error while fetching users', error);
        return res.status(500).json({
            message: "Internal server Error"
        });
    }

})

module.exports = router;