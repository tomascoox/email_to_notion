import express from 'express'
import bodyParser from 'body-parser'
const { json: jsonParser, urlencoded: urlencodedParser } = bodyParser
import { config as dotenvConfig } from 'dotenv'
import { Client } from '@notionhq/client'

import { fromHtml } from 'hast-util-from-html'
import { toMdast } from 'hast-util-to-mdast'
import { toMarkdown } from 'mdast-util-to-markdown'
import { markdownToBlocks } from '@tryfabric/martian'

dotenvConfig()

const app = express()
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))

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
        const hast = fromHtml(content, { fragment: true })
        const mdast = toMdast(hast)
        const markdown = toMarkdown(mdast)
        const blocks = markdownToBlocks(markdown)

        const notion = new Client({ auth: process.env.NOTION_API_KEY })

        const properties = {
            Titel: {
                title: [{ text: { content: email.subject } }],
            },
        }

        const createdPage = await notion.pages.create({
            parent: { database_id: process.env.NOTION_DATABASE_ID },
            properties,
            children: blocks,
        })

        console.log(`Successfully added email to Notion: ${createdPage.id}`)
    } catch (error) {
        console.error('Error adding email to Notion:', error)
    }
}
