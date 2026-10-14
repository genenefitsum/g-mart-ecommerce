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
    legal: {
      companyName: { type: String, trim: true, maxlength: 140, default: 'G-mart E-Commerce PLC' },
      registeredAddress: { type: String, trim: true, maxlength: 240, default: 'Bole Sub-City, Addis Ababa, Ethiopia' },
      registrationNumber: { type: String, trim: true, maxlength: 80, default: 'ET-MTR-2024-00918' },
      taxId: { type: String, trim: true, maxlength: 80, default: 'TIN-008291823' },
      legalEmail: { type: String, trim: true, maxlength: 140, default: 'gmartofficial@gmail.com' },
      effectiveDate: { type: String, trim: true, maxlength: 60, default: 'October 14, 2026' },
      termsVersion: { type: String, trim: true, maxlength: 20, default: '1.0' },
      privacyVersion: { type: String, trim: true, maxlength: 20, default: '1.0' },
      returnWindowDays: { type: Number, default: 7 },
    },
  },
  { timestamps: true },
)

const SiteSettings =
  mongoose.models.SiteSettings ?? mongoose.model('SiteSettings', siteSettingsSchema)

export default SiteSettings
