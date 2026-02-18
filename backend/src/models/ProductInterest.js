import mongoose from 'mongoose'

const { Schema } = mongoose

const productInterestSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
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
    buyerNameSnapshot: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },
    buyerEmailSnapshot: {
      type: String,
      default: '',
      trim: true,
      maxlength: 254,
    },
    mode: {
      type: String,
      enum: ['notify_only', 'with_contact'],
      required: true,
      index: true,
    },
    buyerContact: {
      phone: {
        type: String,
        default: '',
        trim: true,
        maxlength: 32,
      },
      email: {
        type: String,
        default: '',
        trim: true,
        maxlength: 254,
      },
      note: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500,
      },
    },
    status: {
      type: String,
      enum: ['new', 'read'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true },
)

productInterestSchema.index({ sellerUserId: 1, createdAt: -1 })
productInterestSchema.index({ productId: 1, buyerUserId: 1, mode: 1, createdAt: -1 })

const ProductInterest =
  mongoose.models.ProductInterest ?? mongoose.model('ProductInterest', productInterestSchema)

export default ProductInterest
