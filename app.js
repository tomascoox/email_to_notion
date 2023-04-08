import express from 'express'
import bodyParser from 'body-parser'
const { json: jsonParser, urlencoded: urlencodedParser } = bodyParser
import { config as dotenvConfig } from 'dotenv'
import { Client } from '@notionhq/client'

import { markdownToBlocks } from '@tryfabric/martian';

import TurndownService from 'turndown'
const turndownService = new TurndownService()

dotenvConfig()

const app = express()
app.use(jsonParser())
app.use(urlencodedParser({ extended: true }))

const notion = new Client({ auth: process.env.NOTION_API_KEY })

app.post('/webhook', async (req, res) => {
    const email = {
        from: req.body.from,
        subject: req.body.subject,
        content: req.body['stripped-html'],
    }

    await addEmailToNotionDatabase(email, email.content)
    res.sendStatus(200)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

async function addEmailToNotionDatabase(email, content) {
    try {

        if (typeof content !== 'string') {
            console.warn('Invalid content received, skipping Turndown processing');
            content = '';
        }

        const markdown = turndownService.turndown(content)

        const blocks = markdownToBlocks(markdown);

        const properties = {
            Titel: {
                title: [{ text: { content: email.subject } }],
            },
        }

        const createdPage = await notion.pages.create({
            parent: { database_id: process.env.NOTION_DATABASE_ID },
            properties: properties,
            children: blocks,
        })

        console.log(`Successfully added email to Notion: ${createdPage.id}`)
    } catch (error) {
        console.error('Error adding email to Notion:', error)
    }
}
