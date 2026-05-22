import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { startAnalyticsWorker } from './workers/analyticsWorker.js';

await connectDatabase();

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`DevTrackr API listening on port ${env.PORT}`);
});

startAnalyticsWorker();
