import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, Star, Trash2 } from 'lucide-react'

import {
  apiCreateProductInterest,
  apiDeleteProduct,
  apiGetMyProductRating,
  apiGetMySellerRating,
  apiGetProductRatingSummary,
  apiGetSellerRatingSummary,
  apiGetProduct,
  apiUpsertProductRating,
  apiUpsertSellerRating,
  apiUpdateProduct,
  resolveAssetUrl,
} from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toErrorMessage } from '@/lib/errors'
import { formatBirr } from '@/lib/utils'

const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <rect width="800" height="800" fill="#f3f4f6"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="28">
                Image unavailable
            </text>
    </svg>`,
)}`

function normalizeProduct(product) {
  const id = String(product?._id ?? product?.id ?? '')
  const fromImages = Array.isArray(product?.images) ? product.images : []
  const fallbackList = [product?.imageUrl, product?.image]
  const images = [...fromImages, ...fallbackList]
    .map((value) => resolveAssetUrl(value))
    .filter(Boolean)

  const uniqueImages = Array.from(new Set(images))

  return {
    id,
    name: product?.name ?? '',
    category: product?.category ?? '',
    price: Number(product?.price ?? 0),
    description: product?.description ?? '',
    contactPhone: product?.contactPhone ?? '',
    image: uniqueImages[0] ?? '',
    images: uniqueImages,
    sellerUserId: String(product?.sellerUserId ?? ''),
    rating: Number(product?.rating ?? product?.ratingAverage ?? 0),
    reviewCount: Number(product?.reviewCount ?? product?.ratingCount ?? 0),
    canAddToCart:
      typeof product?.canAddToCart === 'boolean'
        ? product.canAddToCart
        : Boolean(product?.isAdminProduct),
  }
}

export default function ProductDetails() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState('')
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editImageFiles, setEditImageFiles] = useState([])
  const [contactOpen, setContactOpen] = useState(false)
  const [interestMode, setInterestMode] = useState('notify_only')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerNote, setBuyerNote] = useState('')
  const [interestSubmitting, setInterestSubmitting] = useState(false)
  const [interestStatus, setInterestStatus] = useState('')
  const [interestError, setInterestError] = useState('')
  const [selectedRating, setSelectedRating] = useState(0)
  const [myRating, setMyRating] = useState(0)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [ratingStatus, setRatingStatus] = useState('')
  const [sellerRating, setSellerRating] = useState(0)
  const [sellerReviewCount, setSellerReviewCount] = useState(0)
  const [selectedSellerRating, setSelectedSellerRating] = useState(0)
  const [mySellerRating, setMySellerRating] = useState(0)
  const [sellerRatingBusy, setSellerRatingBusy] = useState(false)
  const [sellerRatingError, setSellerRatingError] = useState('')
  const [sellerRatingStatus, setSellerRatingStatus] = useState('')

  const isOwnerOrAdmin = useMemo(() => {
    if (!user || !product) return false
    if (String(user.role ?? '').toLowerCase() === 'admin') return true
    return String(user.id ?? '') === String(product.sellerUserId ?? '')
  }, [user, product])

  const isSellerProduct = useMemo(() => {
    if (!product) return false
    return !product.canAddToCart && Boolean(String(product.sellerUserId ?? '').trim())
  }, [product])

  const canSendInterest = useMemo(() => {
    if (!isSellerProduct) return false
    if (!user) return true
    return String(user.id ?? '') !== String(product?.sellerUserId ?? '')
  }, [isSellerProduct, product?.sellerUserId, user])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await apiGetProduct(productId)
        if (!data?.ok) throw new Error(data?.error || 'Failed to load product')
        const p = normalizeProduct(data.product)
        if (!p.id) throw new Error('Product not found')
        if (!cancelled) setProduct(p)
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err, 'Failed to load product'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [product?.id])

  useEffect(() => {
    setSelectedRating(0)
    setMyRating(0)
    setRatingError('')
    setRatingStatus('')
  }, [product?.id])

  useEffect(() => {
    setSellerRating(0)
    setSellerReviewCount(0)
    setSelectedSellerRating(0)
    setMySellerRating(0)
    setSellerRatingError('')
    setSellerRatingStatus('')
  }, [product?.sellerUserId])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!product?.id) return

      try {
        const summary = await apiGetProductRatingSummary(product.id)
        if (!cancelled && summary?.ok) {
          setProduct((prev) =>
            prev
              ? {
                  ...prev,
                  rating: Number(summary.rating ?? 0),
                  reviewCount: Number(summary.reviewCount ?? 0),
                }
              : prev,
          )
        }
      } catch {
        // ignore summary failures on initial page load
      }

      if (!user) return

      try {
        const mine = await apiGetMyProductRating(product.id)
        if (!cancelled && mine?.ok && mine?.hasRating) {
          const stars = Number(mine.stars ?? 0)
          setMyRating(stars)
          setSelectedRating(stars)
        }
      } catch {
        // ignore if no rating yet or user is not eligible
      }
    })()

    return () => {
      cancelled = true
    }
  }, [product?.id, user])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const sellerUserId = String(product?.sellerUserId ?? '').trim()
      if (!sellerUserId) return

      try {
        const summary = await apiGetSellerRatingSummary(sellerUserId)
        if (!cancelled && summary?.ok) {
          setSellerRating(Number(summary.rating ?? 0))
          setSellerReviewCount(Number(summary.reviewCount ?? 0))
        }
      } catch {
        // ignore summary load failures
      }

      if (!user) return

      try {
        const mine = await apiGetMySellerRating(sellerUserId)
        if (!cancelled && mine?.ok && mine?.hasRating) {
          const stars = Number(mine.stars ?? 0)
          setMySellerRating(stars)
          setSelectedSellerRating(stars)
        }
      } catch {
        // ignore if no rating yet or not eligible
      }
    })()

    return () => {
      cancelled = true
    }
  }, [product?.sellerUserId, user])

  const activeImage = product?.images?.[selectedImageIndex] || product?.image || fallbackImage

  const openEdit = () => {
    if (!product) return
    setEditName(product.name)
    setEditPrice(String(product.price ?? ''))
    setEditCategory(product.category)
    setEditDescription(product.description)
    setEditContactPhone(product.contactPhone)
    setEditImageFiles([])
    setEditError('')
    setIsEditing(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!product?.id) return

    setIsSaving(true)
    try {
      setEditError('')

      const formData = new FormData()
      formData.append('name', editName.trim())
      formData.append('price', String(Number(editPrice)))
      formData.append('category', editCategory.trim())
      formData.append('description', editDescription.trim())
      formData.append('contactPhone', editContactPhone.trim())

      editImageFiles.forEach((file) => {
        formData.append('images', file)
      })

      const data = await apiUpdateProduct(product.id, formData)
      if (!data?.ok) throw new Error(data?.error || 'Failed to update product')

      setProduct(normalizeProduct(data.product))
      setIsEditing(false)
    } catch (err) {
      setEditError(toErrorMessage(err, 'Failed to update product'))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProduct = async () => {
    if (!product?.id) return

    const ok = window.confirm('Delete this product permanently?')
    if (!ok) return

    setIsDeleting(true)
    try {
      setEditError('')
      const data = await apiDeleteProduct(product.id)
      if (!data?.ok) throw new Error(data?.error || 'Failed to delete product')
      navigate('/')
    } catch (err) {
      setEditError(toErrorMessage(err, 'Failed to delete product'))
    } finally {
      setIsDeleting(false)
    }
  }

  const openContactDialog = () => {
    if (!product) return

    if (!user) {
      navigate('/account')
      return
    }

    setInterestMode('notify_only')
    setBuyerPhone('')
    setBuyerEmail(user?.email ?? '')
    setBuyerNote('')
    setInterestStatus('')
    setInterestError('')
    setContactOpen(true)
  }

  const submitInterest = async (event) => {
    event.preventDefault()
    if (!product?.id) return

    setInterestSubmitting(true)
    setInterestError('')
    setInterestStatus('')

    try {
      const payload = {
        mode: interestMode,
      }

      if (interestMode === 'with_contact') {
        payload.buyerContact = {
          phone: String(buyerPhone ?? '').trim(),
          email: String(buyerEmail ?? '').trim(),
          note: String(buyerNote ?? '').trim(),
        }
      }

      const data = await apiCreateProductInterest(product.id, payload)
      if (!data?.ok) throw new Error(data?.error || 'Failed to notify seller')

      setInterestStatus('Interest sent to the product owner.')
      setContactOpen(false)
    } catch (err) {
      setInterestError(toErrorMessage(err, 'Failed to notify seller'))
    } finally {
      setInterestSubmitting(false)
    }
  }

  const submitRating = async () => {
    if (!product?.id) return
    if (!user) {
      navigate('/account')
      return
    }

    setRatingBusy(true)
    setRatingError('')
    setRatingStatus('')

    try {
      const stars = Number(selectedRating)
      const data = await apiUpsertProductRating(product.id, stars)
      if (!data?.ok) throw new Error(data?.error || 'Failed to save rating')

      setMyRating(stars)
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              rating: Number(data.rating ?? prev.rating ?? 0),
              reviewCount: Number(data.reviewCount ?? prev.reviewCount ?? 0),
            }
          : prev,
      )

      setRatingStatus(data.created ? 'Rating submitted.' : 'Rating updated.')
    } catch (err) {
      setRatingError(toErrorMessage(err, 'Failed to save rating'))
    } finally {
      setRatingBusy(false)
    }
  }

  const canRate = useMemo(() => {
    if (!product) return false
    if (!user) return true
    if (isOwnerOrAdmin) return false
    return isSellerProduct
  }, [isOwnerOrAdmin, isSellerProduct, product, user])

  const canRateSeller = useMemo(() => {
    if (!product) return false
    if (!String(product.sellerUserId ?? '').trim()) return false
    if (!user) return true
    if (isOwnerOrAdmin) return false
    return isSellerProduct
  }, [isOwnerOrAdmin, isSellerProduct, product, user])

  const submitSellerRating = async () => {
    const sellerUserId = String(product?.sellerUserId ?? '').trim()
    if (!sellerUserId) return
    if (!user) {
      navigate('/account')
      return
    }

    setSellerRatingBusy(true)
    setSellerRatingError('')
    setSellerRatingStatus('')

    try {
      const stars = Number(selectedSellerRating)
      const data = await apiUpsertSellerRating(sellerUserId, stars)
      if (!data?.ok) throw new Error(data?.error || 'Failed to save seller rating')

      setMySellerRating(stars)
      setSellerRating(Number(data.rating ?? sellerRating))
      setSellerReviewCount(Number(data.reviewCount ?? sellerReviewCount))
      setSellerRatingStatus(data.created ? 'Seller rating submitted.' : 'Seller rating updated.')
    } catch (err) {
      setSellerRatingError(toErrorMessage(err, 'Failed to save seller rating'))
    } finally {
      setSellerRatingBusy(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
        <div className="mt-4 text-sm text-red-600">{toErrorMessage(error || 'Product not found', '')}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>

        <Button
          type="button"
          className="bg-blue-600 text-white hover:bg-blue-700"
          disabled={!product.canAddToCart}
          onClick={() =>
            product.canAddToCart
              ?
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              canAddToCart: product.canAddToCart,
            })
              : null
          }
        >
          <ShoppingCart />
          {product.canAddToCart ? 'Add to cart' : 'Wishlist only'}
        </Button>
      </div>

      {isOwnerOrAdmin ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={openEdit} disabled={isDeleting}>
            Edit product
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={deleteProduct}
            disabled={isDeleting}
          >
            <Trash2 />
            {isDeleting ? 'Deleting…' : 'Delete product'}
          </Button>
        </div>
      ) : null}

      {isEditing ? (
        <form onSubmit={saveEdit} className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 grid gap-3">
          <div className="text-base font-semibold text-gray-900">Edit product</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                min={0}
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input id="edit-category" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact phone</Label>
              <Input
                id="edit-contact"
                value={editContactPhone}
                onChange={(e) => setEditContactPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-images">Replace images (optional)</Label>
              <Input
                id="edit-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setEditImageFiles(Array.from(e.target.files ?? []))}
              />
              <div className="text-xs text-gray-500">If you add images, the first selected image becomes the cover.</div>
            </div>
          </div>

          {editError ? <div className="text-sm text-red-600">{editError}</div> : null}

          <div className="flex items-center gap-2">
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {!isEditing && editError ? <div className="mb-4 text-sm text-red-600">{editError}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <img
            src={activeImage}
            alt={product.name}
            className="h-[380px] w-full rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackImage
            }}
          />

          {product.images.length > 1 ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev <= 0 ? product.images.length - 1 : prev - 1,
                    )
                  }
                >
                  <ChevronLeft />
                  Prev
                </Button>
                <div className="text-xs text-gray-500">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev >= product.images.length - 1 ? 0 : prev + 1,
                    )
                  }
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={
                      `h-16 w-16 shrink-0 overflow-hidden rounded border ${index === selectedImageIndex ? 'border-blue-600' : 'border-gray-200'}`
                    }
                  >
                    <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-montserrat">
            {product.category}
          </div>
          {product.canAddToCart ? (
            <div className="mt-2 inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
              Admin product
            </div>
          ) : null}
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 font-montserrat">
            {product.name}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-amber-500" />
              <span className="font-semibold text-gray-900">
                {Number(product.rating ?? 0).toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500">({Number(product.reviewCount ?? 0)})</span>
          </div>

          <div className="mt-3 text-lg font-semibold text-gray-900">
            {formatBirr(product.price)}
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">Rate this product</div>

            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= (selectedRating || myRating)
                return (
                  <button
                    key={value}
                    type="button"
                    className="rounded p-1 text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canRate || ratingBusy}
                    onClick={() => {
                      setSelectedRating(value)
                      setRatingError('')
                      setRatingStatus('')
                    }}
                    aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                  >
                    <Star className={`h-5 w-5 ${active ? 'fill-amber-500' : ''}`} />
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!canRate || ratingBusy || selectedRating < 1}
                onClick={submitRating}
              >
                {ratingBusy ? 'Saving…' : myRating ? 'Update rating' : 'Submit rating'}
              </Button>

              {!user ? (
                <span className="text-xs text-gray-500">Sign in to rate.</span>
              ) : null}
              {user && isOwnerOrAdmin ? (
                <span className="text-xs text-gray-500">You cannot rate your own product.</span>
              ) : null}
              {user && !isOwnerOrAdmin && !isSellerProduct ? (
                <span className="text-xs text-gray-500">Rating is available for seller listings.</span>
              ) : null}
            </div>

            {ratingStatus ? <div className="mt-2 text-sm text-green-700">{ratingStatus}</div> : null}
            {ratingError ? <div className="mt-2 text-sm text-red-600">{ratingError}</div> : null}
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-gray-900">Description</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {product.description || 'No description provided.'}
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">Seller contact</div>
            <div className="text-sm text-gray-700">
              Phone: <span className="font-semibold">{product.contactPhone || '—'}</span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
                <span className="font-semibold text-gray-900">
                  {Number(sellerRating ?? 0).toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500">({Number(sellerReviewCount ?? 0)})</span>
            </div>

            <div className="mt-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rate seller</div>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= (selectedSellerRating || mySellerRating)
                  return (
                    <button
                      key={`seller-${value}`}
                      type="button"
                      className="rounded p-1 text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canRateSeller || sellerRatingBusy}
                      onClick={() => {
                        setSelectedSellerRating(value)
                        setSellerRatingError('')
                        setSellerRatingStatus('')
                      }}
                      aria-label={`Rate seller ${value} star${value === 1 ? '' : 's'}`}
                    >
                      <Star className={`h-5 w-5 ${active ? 'fill-amber-500' : ''}`} />
                    </button>
                  )
                })}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canRateSeller || sellerRatingBusy || selectedSellerRating < 1}
                  onClick={submitSellerRating}
                >
                  {sellerRatingBusy ? 'Saving…' : mySellerRating ? 'Update seller rating' : 'Submit seller rating'}
                </Button>
                {!user ? <span className="text-xs text-gray-500">Sign in to rate.</span> : null}
                {user && isOwnerOrAdmin ? (
                  <span className="text-xs text-gray-500">You cannot rate yourself.</span>
                ) : null}
              </div>

              {sellerRatingStatus ? <div className="mt-2 text-sm text-green-700">{sellerRatingStatus}</div> : null}
              {sellerRatingError ? <div className="mt-2 text-sm text-red-600">{sellerRatingError}</div> : null}
            </div>

            {canSendInterest ? (
              <div>
                <Button type="button" variant="outline" onClick={openContactDialog}>
                  Contact seller
                </Button>
              </div>
            ) : null}

            {interestStatus ? (
              <div className="text-sm text-green-700">{interestStatus}</div>
            ) : null}
            {interestError ? (
              <div className="text-sm text-red-600">{interestError}</div>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="w-[min(92vw,560px)] max-w-none rounded-3xl border border-gray-200 bg-white p-6 sm:p-7">
          <form onSubmit={submitInterest} className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact seller</h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose whether to notify the seller only, or include your contact details.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={interestMode === 'notify_only' ? 'default' : 'outline'}
                onClick={() => setInterestMode('notify_only')}
              >
                Notify only
              </Button>
              <Button
                type="button"
                variant={interestMode === 'with_contact' ? 'default' : 'outline'}
                onClick={() => setInterestMode('with_contact')}
              >
                Notify + contact info
              </Button>
            </div>

            {interestMode === 'with_contact' ? (
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interest-phone">Phone</Label>
                  <Input
                    id="interest-phone"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+2519..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest-email">Email</Label>
                  <Input
                    id="interest-email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest-note">Short note (optional)</Label>
                  <textarea
                    id="interest-note"
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    maxLength={500}
                    placeholder="I am interested in this product."
                  />
                </div>
              </div>
            ) : null}

            {interestError ? (
              <div className="text-sm text-red-600">{interestError}</div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={interestSubmitting}>
                {interestSubmitting ? 'Sending…' : 'Send notification'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
