import 'dotenv/config'
import { Queue, Worker, QueueEvents } from 'bullmq'

const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } }

// Example queue
const queueName = 'ingestion'

export const ingestionQueue = new Queue(queueName, connection)

export const ingestionWorker = new Worker(
  queueName,
  async (job) => {
    console.log('processing job', job.name, job.id)
  },
  connection,
)

const events = new QueueEvents(queueName, connection)

events.on('completed', ({ jobId }) => console.log('job completed', jobId))

events.on('failed', ({ jobId, failedReason }) => console.error('job failed', jobId, failedReason))

console.log('Worker started for queue:', queueName)
