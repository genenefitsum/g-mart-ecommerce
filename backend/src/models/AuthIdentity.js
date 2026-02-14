import mongoose from 'mongoose'

const { Schema } = mongoose

const authIdentitySchema = new Schema ({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    provider: {
        type: String,
        required: true,
        enum: ['local', 'google' ],
        index: true,
    },
    providerUserId: {
        type: String,
        default: undefined,
        trim: true,
        index: true,
    },
    emailLower: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i, 
        index: true,
    },
    passwordHash: {
        type: String,
        default: null,
        select: false,
    },
    emailVerified: {
        type: Boolean,
        default: false,
        index: true,
    },
    profile: {
        displayName: { type: String, default: '' },
        avatarUrl: { type: String, default: ''},
    },

    lastLoginAt: { type: Date, default: null },
    },

    { timestamps: true }
)

authIdentitySchema.index(
    { provider: 1, emailLower: 1 },
    { unique: true, partialFilterExpression: { provider: 'local' }}
)

const AuthIdentity = 
    mongoose.models.AuthIdentity ??
    mongoose.model('AuthIdentity', authIdentitySchema)

export default AuthIdentity
