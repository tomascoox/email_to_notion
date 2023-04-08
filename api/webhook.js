module.exports = async (req, res) => {
    const email = {
        from: req.body.from,
        subject: req.body.subject,
        content: req.body['stripped-html'],
    }

    await addEmailToNotionDatabase(email, email.content)
    res.sendStatus(200)
})
