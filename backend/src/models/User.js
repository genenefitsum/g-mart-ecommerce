import mongoose from 'mongoose'

const userSchema = new mongoose.Schema ({
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    isPermanentAdmin: {
        type: Boolean,
        default: false,
    },
    sellerRatingAverage: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    sellerRatingCount: {
        type: Number,
        default: 0,
        min: 0,
    },
},
    { timestamps: true }

)

userSchema.index({ role: 1, createdAt: -1 })

const User = mongoose.models.User ?? mongoose.model('User', userSchema)

export default User