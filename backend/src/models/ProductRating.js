import mongoose from 'mongoose'

const { Schema } = mongoose

const productRatingSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
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

productRatingSchema.index({ productId: 1, buyerUserId: 1 }, { unique: true })
productRatingSchema.index({ productId: 1, createdAt: -1 })

const ProductRating =
  mongoose.models.ProductRating ?? mongoose.model('ProductRating', productRatingSchema)

export default ProductRating
