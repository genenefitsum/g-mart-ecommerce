import mongoose from 'mongoose'

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main',
      trim: true,
      maxlength: 40,
    },
    paymentRecipient: {
      telebirrPhone: { type: String, trim: true, maxlength: 40, default: '' },
      bankName: { type: String, trim: true, maxlength: 80, default: '' },
      bankAccountNumber: { type: String, trim: true, maxlength: 80, default: '' },
      bankAccountName: { type: String, trim: true, maxlength: 140, default: '' },
    },
    content: {
      storeName: { type: String, trim: true, maxlength: 140, default: 'G-mart' },
      supportEmail: { type: String, trim: true, maxlength: 140, default: '' },
      supportPhone: { type: String, trim: true, maxlength: 40, default: '' },
      bannerMessage: { type: String, trim: true, maxlength: 280, default: '' },
    },
  },
  { timestamps: true },
)

const SiteSettings =
  mongoose.models.SiteSettings ?? mongoose.model('SiteSettings', siteSettingsSchema)

export default SiteSettings
