import mongoose from 'mongoose'

const { Schema } = mongoose

const orderItemSchema = new Schema(
	{
		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 140,
		},
		unitPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		imageUrl: {
			type: String,
			default: '',
			trim: true,
			maxlength: 2048,
		},
	},
	{ _id: false },
)

const orderSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		items: {
			type: [orderItemSchema],
			default: [],
			validate: {
				validator: (v) => Array.isArray(v) && v.length > 0,
				message: 'Order items are required',
			},
		},
		subtotal: {
			type: Number,
			required: true,
			min: 0,
		},
		currency: {
			type: String,
			trim: true,
			maxlength: 8,
			default: 'ETB',
		},
		shipping: {
			name: { type: String, trim: true, maxlength: 140, default: '' },
			phone: { type: String, trim: true, maxlength: 40, default: '' },
			addressLine1: { type: String, trim: true, maxlength: 200, default: '' },
			city: { type: String, trim: true, maxlength: 80, default: '' },
			notes: { type: String, trim: true, maxlength: 500, default: '' },
		},
		payment: {
			method: {
				type: String,
				enum: ['telebirr', 'bank'],
				required: true,
			},
			transactionRef: {
				type: String,
				trim: true,
				maxlength: 120,
				default: '',
			},
			proofImageUrl: {
				type: String,
				trim: true,
				maxlength: 2048,
				default: '',
			},
			submittedAt: {
				type: Date,
				default: null,
			},
		},
		recipient: {
			telebirrPhone: { type: String, trim: true, maxlength: 40, default: '' },
			bankName: { type: String, trim: true, maxlength: 80, default: '' },
			bankAccountNumber: { type: String, trim: true, maxlength: 80, default: '' },
			bankAccountName: { type: String, trim: true, maxlength: 140, default: '' },
		},
		status: {
			type: String,
			enum: ['pending_payment', 'payment_submitted', 'processing', 'completed', 'cancelled'],
			default: 'pending_payment',
			index: true,
		},
	},
	{ timestamps: true },
)

orderSchema.index({ userId: 1, createdAt: -1 })

const Order = mongoose.models.Order ?? mongoose.model('Order', orderSchema)

export default Order
