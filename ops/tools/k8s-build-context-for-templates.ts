import { exec } from 'child_process'
import { promisify } from 'util'
import { Context } from './resolve-k8s-templates'

const execP = promisify(exec)

interface ImageTag {
  tags: string[]
  timestamp: {
    datetime: string
  }
}

export const buildContext = async (): Promise<Context> => {
  const { stdout, stderr } = await execP('gcloud container images list-tags --project $PROJECT_ID gcr.io/$PROJECT_ID/game-engine --format=json')

  if (stderr) {
    console.log(stderr)
    process.exit(1)
  }

  const imageTags: ImageTag[] = JSON.parse(stdout)
  const sortedTags = imageTags.sort((a, b) => {
    const aTimestamp = new Date(a.timestamp.datetime).getTime()
    const bTimestamp = new Date(b.timestamp.datetime).getTime()

    return aTimestamp - bTimestamp
  })
  const latestTag = sortedTags[sortedTags.length - 1].tags[0]

  if (!process.env.PROJECT_ID) {
    console.error('Missing or empty "PROJECT_ID" env variable')
    return process.exit(1)
  }

  return {
    ImageTag: latestTag,
    ProjectId: process.env.PROJECT_ID
  }
}
