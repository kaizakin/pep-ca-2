import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
    actionItem: { type: String, required: true }
  },
  { _id: false }
);

const repositoryAnalyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    fullName: { type: String, required: true, index: true },
    calculatedAt: { type: Date, required: true, default: Date.now },
    sprintWindow: {
      since: { type: Date, required: true },
      until: { type: Date, required: true }
    },
    metrics: {
      totalCommits: { type: Number, default: 0 },
      totalAdditions: { type: Number, default: 0 },
      totalDeletions: { type: Number, default: 0 },
      openPullRequests: { type: Number, default: 0 },
      mergedPullRequests: { type: Number, default: 0 },
      closedIssues: { type: Number, default: 0 },
      averagePrCycleHours: { type: Number, default: 0 }
    },
    charts: {
      codeVelocity: [
        {
          date: String,
          additions: Number,
          deletions: Number,
          commits: Number
        }
      ],
      workDistribution: [
        {
          contributor: String,
          commits: Number
        }
      ],
      prCycleTime: [
        {
          title: String,
          number: Number,
          hoursToMerge: Number,
          state: String
        }
      ]
    },
    ai: {
      sprintSummary: { type: String, default: '' },
      inactiveContributors: { type: [String], default: [] },
      bottlenecks: { type: [String], default: [] },
      recommendations: { type: [recommendationSchema], default: [] }
    },
    rawActivity: {
      commits: { type: Array, default: [] },
      pullRequests: { type: Array, default: [] },
      issues: { type: Array, default: [] }
    }
  },
  { timestamps: true }
);

repositoryAnalyticsSchema.index({ userId: 1, fullName: 1 }, { unique: true });

export const RepositoryAnalytics = mongoose.model('RepositoryAnalytics', repositoryAnalyticsSchema);
