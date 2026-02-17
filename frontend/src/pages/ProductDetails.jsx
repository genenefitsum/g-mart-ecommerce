import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react'

import { apiDeleteProduct, apiGetProduct, apiUpdateProduct, resolveAssetUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
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

  return {
    id,
    name: product?.name ?? '',
    category: product?.category ?? '',
    price: Number(product?.price ?? 0),
    description: product?.description ?? '',
    contactPhone: product?.contactPhone ?? '',
    image: images[0] ?? '',
    images,
    sellerUserId: String(product?.sellerUserId ?? ''),
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

  const isOwnerOrAdmin = useMemo(() => {
    if (!user || !product) return false
    if (String(user.role ?? '').toLowerCase() === 'admin') return true
    return String(user.id ?? '') === String(product.sellerUserId ?? '')
  }, [user, product])

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

          <div className="mt-3 text-lg font-semibold text-gray-900">
            {formatBirr(product.price)}
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
          </div>
        </div>
      </div>
    </div>
  )
}
