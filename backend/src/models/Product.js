import mongoose from 'mongoose'

const { Schema } = mongoose

const productSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 140,
			index: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		category: {
			type: String,
			required: true,
			trim: true,
			maxlength: 60,
			index: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
			minlength: 10,
			maxlength: 2000,
		},
		contactPhone: {
			type: String,
			required: true,
			trim: true,
			maxlength: 32,
		},
		imageUrl: {
			type: String,
			required: true,
			trim: true,
			maxlength: 2048,
		},
		images: {
			type: [
				{
					type: String,
					trim: true,
					maxlength: 2048,
				},
			],
			default: [],
		},
		sellerUserId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
			index: true,
		},
		isAdminProduct: {
			type: Boolean,
			default: false,
			index: true,
		},
		ratingAverage: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		ratingCount: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{ timestamps: true },
)

productSchema.index({ category: 1, createdAt: -1 })
productSchema.index({ sellerUserId: 1, createdAt: -1 })
productSchema.index({ isAdminProduct: 1, createdAt: -1 })
productSchema.index({ name: 'text', description: 'text', category: 'text' })

const Product = mongoose.models.Product ?? mongoose.model('Product', productSchema)

export default Product
