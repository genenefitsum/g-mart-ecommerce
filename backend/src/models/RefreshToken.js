import mongoose from 'mongoose'

const { Schema } = mongoose

const refreshTokenSchema = new Schema(
{
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    authIdentityId: {
        type: Schema.Types.ObjectId,
        ref: 'AuthIdentity',
        required: true,
        index: true,
    },
    jti: {
        type: String,
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        select: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    revokedAt: {
        type: Date,
        default: null,
        index: true,
    },
},
    { timestamps: true },
)

refreshTokenSchema.index({ authIdentityId: 1, jti: 1 }, { unique: true })

const RefreshToken =
    mongoose.models.RefreshToken ??
    mongoose.model('RefreshToken', refreshTokenSchema)

export default RefreshToken
