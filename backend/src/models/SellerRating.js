import mongoose from 'mongoose'

const { Schema } = mongoose

const sellerRatingSchema = new Schema(
  {
    sellerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
)

sellerRatingSchema.index({ sellerUserId: 1, buyerUserId: 1 }, { unique: true })
sellerRatingSchema.index({ sellerUserId: 1, createdAt: -1 })

const SellerRating = mongoose.models.SellerRating ?? mongoose.model('SellerRating', sellerRatingSchema)

export default SellerRating
