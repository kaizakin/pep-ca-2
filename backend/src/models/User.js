import mongoose from 'mongoose';

const encryptedTokenSchema = new mongoose.Schema(
  {
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    ciphertext: { type: String, required: true }
  },
  { _id: false }
);

const repositorySchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true },
    installationId: Number,
    lastSyncedAt: Date
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    githubId: { type: Number, required: true, unique: true, index: true },
    login: { type: String, required: true, index: true },
    avatarUrl: String,
    encryptedAccessToken: { type: encryptedTokenSchema, required: true },
    repositories: [repositorySchema]
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
