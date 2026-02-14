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
		sellerUserId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
			index: true,
		},
		sellerPayment: {
			telebirrPhone: {
				type: String,
				trim: true,
				maxlength: 40,
				default: '',
			},
			bankName: {
				type: String,
				trim: true,
				maxlength: 80,
				default: '',
			},
			bankAccountNumber: {
				type: String,
				trim: true,
				maxlength: 80,
				default: '',
			},
			bankAccountName: {
				type: String,
				trim: true,
				maxlength: 140,
				default: '',
			},
		},
	},
	{ timestamps: true },
)

productSchema.index({ category: 1, createdAt: -1 })
productSchema.index({ name: 'text', description: 'text', category: 'text' })

const Product = mongoose.models.Product ?? mongoose.model('Product', productSchema)

export default Product
