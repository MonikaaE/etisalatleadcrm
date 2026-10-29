import { Queue } from 'bullmq';
import { getRedisForBullMQ } from '../lib/redis';

export const importQueue = new Queue('import-jobs', {
  connection: getRedisForBullMQ(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
