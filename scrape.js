import axios from 'axios'
import { parse } from 'parse5'
import { isBefore, parseISO, format } from 'date-fns'
import { Octokit } from '@octokit/rest'
import { stringify } from 'csv-stringify/sync'
import getEOLDate from './index.js'
import fs from 'node:fs/promises'

const github = new Octokit({ auth: process.env.GITHUB_TOKEN })
const eolPageUrl = 'https://docs.newrelic.com/docs/apm/agents/nodejs-agent/getting-started/nodejs-agent-eol-policy/'

const response = await axios.get(eolPageUrl)
const domTree = parse(response.data)

// /html/body/div[1]/div[1]/div[2]/main/div/article/div/div/table
const eolTable = domTree.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[7].childNodes[5].childNodes[1].childNodes[3].childNodes[1].childNodes[5].childNodes[1]
const eolTableRows = eolTable.childNodes[1].childNodes

const output = []

for (const row of eolTableRows) {
  const docsVersion = row.childNodes[0].childNodes[0].childNodes[0].value
  const docsReleaseDate = row.childNodes[1].childNodes[0].childNodes[0].value
  const docsEolDate = row.childNodes[2].childNodes[0].childNodes[0].value

  let githubNotes = null
  let githubReleaseDate = null
  let githubEolDate = null

  if (isBefore(parseISO(docsEolDate), new Date())) {
    console.log(`${docsVersion} is out of support, expired ${docsEolDate}`)
    continue
  }

  try {
    const ghResponse = await github.repos.getReleaseByTag({ owner: 'newrelic', repo: 'node-newrelic', tag: docsVersion })

    githubNotes = ghResponse.data.body
    githubReleaseDate = format(parseISO(ghResponse.data.published_at), 'yyyy-MM-dd')
    githubEolDate = getEOLDate(githubReleaseDate)
  } catch (err) {
    githubNotes = 'Error'
    githubReleaseDate = 'Error'
    githubEolDate = 'Error'
  }

  output.push({ docsVersion, docsReleaseDate, githubReleaseDate, docsEolDate, githubEolDate, githubNotes })
}

const csvOutput = stringify(output, { header: true })

await fs.writeFile('releases.csv', csvOutput)
