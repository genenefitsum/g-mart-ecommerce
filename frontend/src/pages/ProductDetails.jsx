import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

import { apiGetProduct } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'

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
  return {
    id,
    name: product?.name ?? '',
    category: product?.category ?? '',
    price: Number(product?.price ?? 0),
    description: product?.description ?? '',
    contactPhone: product?.contactPhone ?? '',
    image: product?.imageUrl ?? product?.image ?? '',
    sellerPayment: {
      telebirrPhone: product?.sellerPayment?.telebirrPhone ?? '',
      bankName: product?.sellerPayment?.bankName ?? '',
      bankAccountNumber: product?.sellerPayment?.bankAccountNumber ?? '',
      bankAccountName: product?.sellerPayment?.bankAccountName ?? '',
    },
  }
}

export default function ProductDetails() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
        if (!cancelled) setError(err?.message || 'Failed to load product')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [productId])

  const paymentSummary = useMemo(() => {
    const sp = product?.sellerPayment
    if (!sp) return { hasTelebirr: false, hasBank: false }
    const hasTelebirr = Boolean(String(sp.telebirrPhone ?? '').trim())
    const hasBank = Boolean(String(sp.bankAccountNumber ?? '').trim())
    return { hasTelebirr, hasBank }
  }, [product])

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
        <div className="mt-4 text-sm text-red-600">{error || 'Product not found'}</div>
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
          onClick={() =>
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              sellerPayment: product.sellerPayment,
            })
          }
        >
          <ShoppingCart />
          Add to cart
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <img
            src={product.image || fallbackImage}
            alt={product.name}
            className="h-[380px] w-full rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackImage
            }}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-montserrat">
            {product.category}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 font-montserrat">
            {product.name}
          </h1>

          <div className="mt-3 text-lg font-semibold text-gray-900">
            {Number(product.price).toFixed(2)}
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

          <div className="mt-5 grid gap-3 rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">Seller payment info</div>
            <div className="text-xs text-gray-500">
              This is used at checkout. (Demo / user-provided info)
            </div>

            {paymentSummary.hasTelebirr ? (
              <div className="text-sm text-gray-700">
                Telebirr: <span className="font-semibold">{product.sellerPayment.telebirrPhone}</span>
              </div>
            ) : null}

            {paymentSummary.hasBank ? (
              <div className="text-sm text-gray-700">
                Bank: <span className="font-semibold">{product.sellerPayment.bankName || '—'}</span>
                <div className="mt-1 text-sm text-gray-700">
                  Account: <span className="font-semibold">{product.sellerPayment.bankAccountNumber}</span>
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Name: <span className="font-semibold">{product.sellerPayment.bankAccountName || '—'}</span>
                </div>
              </div>
            ) : null}

            {!paymentSummary.hasTelebirr && !paymentSummary.hasBank ? (
              <div className="text-sm text-gray-600">No payment info provided.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
