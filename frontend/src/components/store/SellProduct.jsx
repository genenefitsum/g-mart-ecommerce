import { Button } from '@/components/ui/button'
import AddProductDialog from '@/components/store/AddProductDialog'

const SellProduct = ({ onCreated, onRequireAuth }) => {

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
                    <AddProductDialog
                        onCreated={onCreated}
                        onRequireAuth={onRequireAuth}
                        trigger={(
                            <Button className="bg-blue-600 text-white hover:bg-blue-700 font-montserrat">
                                Add Product
                            </Button>
                        )}
                    />
                </div>
            </div>
        </section>
    )
}

export default SellProduct