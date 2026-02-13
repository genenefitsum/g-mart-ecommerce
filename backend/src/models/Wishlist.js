import mongoose from 'mongoose'

const { Schema } = mongoose

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    productIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  { timestamps: true },
)

const Wishlist = mongoose.models.Wishlist ?? mongoose.model('Wishlist', wishlistSchema)

export default Wishlist
