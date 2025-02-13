const express = require('express')
const router = express.Router();
const { authMiddleware } = require('../middleware.js');
const { Account } = require('../db.js');
const { default: mongoose } = require('mongoose');

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const account = await Account.findOne({
            userId
        })
        if (!account) {
            return res.status(411).json({
                message: "No user found"
            });
        }
        res.status(200).json({
            balance: account.balance
        })
    } catch (error) {
        console.log('Error fetching balances', error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

});

router.post('/transfer', authMiddleware, async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        const userId = req.userId;
        const { to, amount } = req.body;

        const senderAccount = await Account.findOne({
            userId
        }).session(session);
        const senderBalance = senderAccount.balance;
        const receiverAccount = await Account.findOne({
            userId: to
        });

        if (!receiverAccount) {
            await session.abortTransaction();
            return res.status(411).json({
                message: "Invalid receiver"
            })
        }

        const receiverBalance = receiverAccount.balance;

        if (senderBalance < amount) {
            await session.abortTransaction();
            return res.status(411).json({
                message: "Insufficient funds"
            })
        }
        const totalSenderBalance = senderBalance - amount;
        const updatedSender = await Account.findOneAndUpdate({ userId }, { balance: totalSenderBalance }).session(session);

        const totalReceiverBalance = amount + receiverBalance;
        const updatedReceiver = await Account.findOneAndUpdate({ userId: to }, { balance: totalReceiverBalance }).session(session);

        await session.commitTransaction();
        if (updatedSender && updatedReceiver) {
            return res.status(200).json({
                message: "Transfer Successful!"
            })
        }
    } catch (error) {
        console.log("Error transfering the funds", error);
        return res.status(500).json({
            message: "Error transfering funds"
        })
    }

})
module.exports = router;