import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { apiCreateOrder, apiUploadOrderPaymentProof } from '@/lib/api'
import { toErrorMessage } from '@/lib/errors'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, totalPrice, clearCart, setIsCartOpen } = useCart()

  const [shippingName, setShippingName] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingNotes, setShippingNotes] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('telebirr')
  const [transactionRef, setTransactionRef] = useState('')
  const [proofFile, setProofFile] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successOrderId, setSuccessOrderId] = useState('')

  const cartPayloadItems = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .filter((it) => it?.id && it?.quantity)
      .map((it) => ({ productId: String(it.id), quantity: Number(it.quantity) }))
  }, [items])

  const sellerPayment = useMemo(() => {
    const list = Array.isArray(items) ? items : []
    if (!list.length) return null

    const first = list[0]?.sellerPayment ?? null
    if (!first) return null

    const firstKey = JSON.stringify({
      telebirrPhone: first?.telebirrPhone ?? '',
      bankName: first?.bankName ?? '',
      bankAccountNumber: first?.bankAccountNumber ?? '',
      bankAccountName: first?.bankAccountName ?? '',
    })

    const mixed = list.some((it) => {
      const sp = it?.sellerPayment ?? {}
      const key = JSON.stringify({
        telebirrPhone: sp?.telebirrPhone ?? '',
        bankName: sp?.bankName ?? '',
        bankAccountNumber: sp?.bankAccountNumber ?? '',
        bankAccountName: sp?.bankAccountName ?? '',
      })
      return key !== firstKey
    })

    if (mixed) return { mixed: true }

    const normalized = {
      telebirrPhone: first?.telebirrPhone ?? '',
      bankName: first?.bankName ?? '',
      bankAccountNumber: first?.bankAccountNumber ?? '',
      bankAccountName: first?.bankAccountName ?? '',
    }

    const hasTelebirr = Boolean(String(normalized.telebirrPhone).trim())
    const hasBank = Boolean(String(normalized.bankAccountNumber).trim())

    return {
      mixed: false,
      hasTelebirr,
      hasBank,
      ...normalized,
    }
  }, [items])

  const canSubmit =
    Boolean(user) &&
    cartPayloadItems.length > 0 &&
    !isSubmitting &&
    Boolean(proofFile) &&
    Boolean(sellerPayment) &&
    sellerPayment?.mixed === false &&
    (sellerPayment?.hasTelebirr || sellerPayment?.hasBank) &&
    (paymentMethod === 'telebirr' ? sellerPayment?.hasTelebirr : sellerPayment?.hasBank)

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessOrderId('')

    if (!user) {
      setError('Please sign in to checkout.')
      return
    }

    if (!cartPayloadItems.length) {
      setError('Your cart is empty.')
      return
    }

    if (!proofFile) {
      setError('Please upload a payment screenshot/proof.')
      return
    }

    if (!sellerPayment || sellerPayment?.mixed) {
      setError('Please checkout items from one seller at a time.')
      return
    }

    if (paymentMethod === 'telebirr' && !sellerPayment?.hasTelebirr) {
      setError('Seller has no Telebirr payment info. Choose bank transfer.')
      return
    }

    if (paymentMethod === 'bank' && !sellerPayment?.hasBank) {
      setError('Seller has no bank payment info. Choose Telebirr.')
      return
    }

    setIsSubmitting(true)

    try {
      const createRes = await apiCreateOrder({
        items: cartPayloadItems,
        shipping: {
          name: shippingName,
          phone: shippingPhone,
          addressLine1: shippingAddress,
          city: shippingCity,
          notes: shippingNotes,
        },
        payment: {
          method: paymentMethod,
          transactionRef,
        },
      })

      if (!createRes?.ok || !createRes?.order?._id) {
        throw new Error(createRes?.error || 'Failed to create order')
      }

      const orderId = String(createRes.order._id)

      const fd = new FormData()
      fd.append('proof', proofFile)

      const proofRes = await apiUploadOrderPaymentProof(orderId, fd)
      if (!proofRes?.ok) {
        throw new Error(proofRes?.error || 'Failed to upload payment proof')
      }

      setSuccessOrderId(orderId)
      clearCart()
      setIsCartOpen(false)

      window.setTimeout(() => {
        navigate('/')
      }, 900)
    } catch (err) {
      setError(toErrorMessage(err, 'Checkout failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Checkout</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit your order and upload a payment screenshot.
        </p>
      </div>

      <div className="grid gap-5">
        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Pay To</div>

          {sellerPayment?.mixed ? (
            <div className="mt-2 text-sm text-red-600">
              Your cart contains items from different sellers. Please checkout one seller at a time.
            </div>
          ) : null}

          {!sellerPayment ? (
            <div className="mt-2 text-sm text-gray-600">Add items to cart to see payment details.</div>
          ) : sellerPayment?.mixed ? null : (
            <div className="mt-3 grid gap-3 text-sm">
              {paymentMethod === 'telebirr' ? (
                sellerPayment.hasTelebirr ? (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Telebirr</div>
                    <div className="mt-1 font-semibold text-gray-900">{sellerPayment.telebirrPhone}</div>
                    <div className="mt-1 text-xs text-gray-500">Pay to this number, then upload the screenshot below.</div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600">Seller has no Telebirr info.</div>
                )
              ) : sellerPayment.hasBank ? (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Bank transfer</div>
                  <div className="mt-1 font-semibold text-gray-900">{sellerPayment.bankName}</div>
                  <div className="mt-1 text-gray-800">Account: {sellerPayment.bankAccountNumber}</div>
                  <div className="mt-1 text-gray-800">Name: {sellerPayment.bankAccountName}</div>
                  <div className="mt-1 text-xs text-gray-500">Transfer to this account, then upload the screenshot below.</div>
                </div>
              ) : (
                <div className="text-sm text-red-600">Seller has no bank info.</div>
              )}
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Order Summary</div>
          <div className="mt-3 space-y-3">
            {items?.length ? (
              items.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{it.name}</div>
                    <div className="text-xs text-gray-500">
                      Qty: {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {Number(it.price * it.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">Your cart is empty.</div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">Subtotal</div>
            <div className="text-base font-semibold text-gray-900">
              {Number(totalPrice).toFixed(2)}
            </div>
          </div>
        </Card>

        <form onSubmit={onSubmit} className="grid gap-5">
          <Card className="rounded-2xl border border-gray-200 p-5">
            <div className="text-base font-semibold text-gray-900">Shipping / Contact</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shipName">Full name</Label>
                <Input
                  id="shipName"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipPhone">Phone</Label>
                <Input
                  id="shipPhone"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="+251 ..."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="shipAddress">Address</Label>
                <Input
                  id="shipAddress"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street / kebele / house no."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipCity">City</Label>
                <Input
                  id="shipCity"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="Addis Ababa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipNotes">Notes (optional)</Label>
                <Input
                  id="shipNotes"
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  placeholder="Delivery note"
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-200 p-5">
            <div className="text-base font-semibold text-gray-900">Payment</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payMethod">Method</Label>
                <select
                  id="payMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="telebirr">Telebirr</option>
                  <option value="bank">Bank transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="txRef">Transaction / Reference (optional)</Label>
                <Input
                  id="txRef"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Reference id"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="proof">Payment screenshot / proof</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                <div className="text-xs text-gray-500">
                  Upload a screenshot of your Telebirr/bank payment.
                </div>
              </div>
            </div>
          </Card>

          {error ? <div className="text-sm text-red-600">{toErrorMessage(error, '')}</div> : null}
          {successOrderId ? (
            <div className="text-sm text-green-700">
              Order submitted. Order ID: {successOrderId}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={!canSubmit}
            >
              {isSubmitting ? 'Submitting…' : 'Submit order'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Back to shop
            </Button>
          </div>

          {!user ? (
            <div className="text-xs text-gray-500">
              You must be signed in to submit an order.
            </div>
          ) : null}
        </form>
      </div>
    </div>
  )
}
