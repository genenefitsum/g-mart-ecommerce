import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { apiCreateOrder, apiGetOrderPaymentRecipient, apiUploadOrderPaymentProof } from '@/lib/api'
import { toErrorMessage } from '@/lib/errors'
import { formatBirr } from '@/lib/utils'

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
  const [recipient, setRecipient] = useState(null)
  const [recipientError, setRecipientError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successOrderId, setSuccessOrderId] = useState('')

  const cartPayloadItems = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .filter((it) => it?.id && it?.quantity)
      .map((it) => ({ productId: String(it.id), quantity: Number(it.quantity) }))
  }, [items])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!user) {
        setRecipient(null)
        setRecipientError('')
        return
      }

      try {
        setRecipientError('')
        const data = await apiGetOrderPaymentRecipient()
        if (!data?.ok) throw new Error(data?.error || 'Failed to load payment recipient')
        if (!cancelled) setRecipient(data.recipient ?? null)
      } catch (err) {
        if (!cancelled) {
          setRecipient(null)
          setRecipientError(toErrorMessage(err, 'Failed to load admin payment info'))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  const methodAvailable = paymentMethod === 'telebirr' ? recipient?.hasTelebirr : recipient?.hasBank

  const canSubmit =
    Boolean(user) &&
    cartPayloadItems.length > 0 &&
    !isSubmitting &&
    Boolean(proofFile) &&
    Boolean(recipient) &&
    (recipient?.hasTelebirr || recipient?.hasBank) &&
    Boolean(methodAvailable)

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

    if (!recipient) {
      setError('Admin payment info is not available yet.')
      return
    }

    if (paymentMethod === 'telebirr' && !recipient?.hasTelebirr) {
      setError('Admin has no Telebirr payment info. Choose bank transfer.')
      return
    }

    if (paymentMethod === 'bank' && !recipient?.hasBank) {
      setError('Admin has no bank payment info. Choose Telebirr.')
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

          {recipientError ? <div className="mt-2 text-sm text-red-600">{recipientError}</div> : null}

          {!recipient ? (
            <div className="mt-2 text-sm text-gray-600">Sign in to load admin payment details.</div>
          ) : (
            <div className="mt-3 grid gap-3 text-sm">
              {paymentMethod === 'telebirr' ? (
                recipient.hasTelebirr ? (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Telebirr</div>
                    <div className="mt-1 font-semibold text-gray-900">{recipient.telebirrPhone}</div>
                    <div className="mt-1 text-xs text-gray-500">Pay to this number, then upload the screenshot below.</div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600">Admin has no Telebirr info.</div>
                )
              ) : recipient.hasBank ? (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Bank transfer</div>
                  <div className="mt-1 font-semibold text-gray-900">{recipient.bankName}</div>
                  <div className="mt-1 text-gray-800">Account: {recipient.bankAccountNumber}</div>
                  <div className="mt-1 text-gray-800">Name: {recipient.bankAccountName}</div>
                  <div className="mt-1 text-xs text-gray-500">Transfer to this account, then upload the screenshot below.</div>
                </div>
              ) : (
                <div className="text-sm text-red-600">Admin has no bank info.</div>
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
                    {formatBirr(it.price * it.quantity)}
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
              {formatBirr(totalPrice)}
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
