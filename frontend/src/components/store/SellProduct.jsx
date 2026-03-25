import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiCreateProduct } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toErrorMessage } from '@/lib/errors'

const CATEGORIES = [
    "Men's",
    "Women's",
    'Accessories',
    'Jewelry',
    'Watches',
    'Eyewear',
    'Sale',
]

const SellProduct = ({ onCreated, onRequireAuth }) => {
    const { user } = useAuth()

    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [category, setCategory] = useState(CATEGORIES[0])
    const [description, setDescription] = useState('')
    const [contactPhone, setContactPhone] = useState('')
    const [imageFiles, setImageFiles] = useState([])

    const canSubmit = useMemo(() => {
        if (!name.trim()) return false
        if (!price || !Number.isFinite(Number(price)) || Number(price) < 0) return false
        if (!category) return false
        if (!description.trim()) return false
        if (!contactPhone.trim()) return false
        if (!imageFiles.length) return false

        return true
    }, [name, price, category, description, contactPhone, imageFiles])

    const resetForm = () => {
        setName('')
        setPrice('')
        setCategory(CATEGORIES[0])
        setDescription('')
        setContactPhone('')
        setImageFiles([])
        setError('')
    }

    const onOpenChange = (next) => {
        if (next) {
            if (!user) {
                if (typeof onRequireAuth === 'function') onRequireAuth()
                return
            }
            setOpen(true)
            return
        }

        setOpen(false)
        resetForm()
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!user) {
            if (typeof onRequireAuth === 'function') onRequireAuth()
            return
        }

        if (!canSubmit) return

        setIsSubmitting(true)
        try {
            setError('')

            const formData = new FormData()
            formData.append('name', name.trim())
            formData.append('price', String(Number(price)))
            formData.append('category', category)
            formData.append('description', description.trim())
            formData.append('contactPhone', contactPhone.trim())
            imageFiles.forEach((file) => {
                formData.append('images', file)
            })

            const data = await apiCreateProduct(formData)
            if (!data?.ok) {
                throw new Error(data?.error || 'Failed to create product')
            }

            setOpen(false)
            resetForm()
            if (typeof onCreated === 'function') onCreated(data.product)
        } catch (err) {
            setError(toErrorMessage(err, 'Failed to create product'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="sell" className="scroll-mt-32 pb-16 lg:pb-24  bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10 lg:mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 font-montserrat">
                        Sell Products
                    </h2>
                    <p className="text-gray-400 max-w-md mx-auto font-montserrat">
                        List your items for sale so other users can find and buy them.
                    </p>
                </div>

                <div className="flex justify-center">
                    <Dialog open={open} onOpenChange={onOpenChange}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 text-white hover:bg-blue-700 font-montserrat">
                                Add Product
                            </Button>
                        </DialogTrigger>

                        <DialogContent
                            className="w-[min(94vw,560px)] max-h-[88dvh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-5 sm:p-6"
                            overlayClassName="bg-black/40 backdrop-blur-sm"
                        >
                            <div className="mb-2">
                                <div className="text-lg font-semibold text-gray-900">Add product</div>
                                <div className="mt-1 text-sm text-gray-500">
                                    Fill the details below to list your product.
                                </div>
                            </div>

                            <form className="space-y-4" onSubmit={onSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="sell-name">Product Name</Label>
                                    <Input
                                        id="sell-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. AirPods Pro"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sell-price">Price</Label>
                                    <Input
                                        id="sell-price"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="e.g. 199.99"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sell-category">Type / Category</Label>
                                    <select
                                        id="sell-category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sell-description">Description</Label>
                                    <textarea
                                        id="sell-description"
                                        className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the product condition, features, and anything buyers should know"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sell-contact">Contact (Phone)</Label>
                                    <Input
                                        id="sell-contact"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="e.g. +234 801 234 5678"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sell-image">Images</Label>
                                    <Input
                                        id="sell-image"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                                        required
                                    />
                                    <div className="text-xs text-gray-500">
                                        Add one or more images. The first selected image is used as cover.
                                    </div>
                                </div>

                                {error ? <div className="text-sm text-red-600">{toErrorMessage(error, '')}</div> : null}

                                <div className="flex justify-end gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                        disabled={!canSubmit || isSubmitting}
                                    >
                                        {isSubmitting ? 'Adding…' : 'Add Product'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </section>
    )
}

export default SellProduct