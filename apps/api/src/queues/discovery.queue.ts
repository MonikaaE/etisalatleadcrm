import { Queue } from 'bullmq';
import { getRedisForBullMQ } from '../lib/redis';

export const discoveryQueue = new Queue('discovery-jobs', {
  connection: getRedisForBullMQ(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 25 },
  },
});

export const enrichmentQueue = new Queue('enrichment-jobs', {
  connection: getRedisForBullMQ(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export const campaignQueue = new Queue('campaign-jobs', {
  connection: getRedisForBullMQ(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
  },
});
