import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
    {
        id: "mens",
        name: "Men's",
        description: "Shop the collection",
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80",
    },
    {
        id: "womens",
        name: "Women's",
        description: "Shop the collection",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    },
    {
        id: "accessories",
        name: "Accessories",
        description: "Shop the collection",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80",
    },
    {
        id: "sale",
        name: "Sale",
        description: "Up to 50% off",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
    },
];

const CategoriesSection = ({ searchQuery = "" }) => {
    const query = searchQuery.trim().toLowerCase();
    const filteredCategories = query
        ? categories.filter((category) => {
            const haystack = `${category.name} ${category.description}`.toLowerCase();
            return haystack.includes(query);
        })
        : categories;

    return (
    <section id="categories" className="scroll-mt-32 py-16 lg:py-24">
        <div className="container mx-auto px-4 mt-16">
        <div className="mx-auto w-full max-w-6xl">
            {/* Section Header */}
            <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 font-montserrat">
                Shop by Category
                </h2>
                <p className="text-gray-400 max-w-md mx-auto font-montserrat">
                Browse our curated collections and find exactly what you're looking for
                </p>
            </div>

            {/* Categories Grid */}
            {filteredCategories.length === 0 ? (
                <div className="text-center text-gray-500 font-montserrat">
                    No categories found for “{searchQuery}”.
                </div>
            ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredCategories.map((category, index) => (
                <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden shadow-md"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Image */}
                    <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                  {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                        {category.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-200 text-sm font-medium group-hover:text-white transition-colors">
                        <span>{category.description}</span>
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </div>
                    </div>
                </Link>
                ))}
                </div>
            )}
        </div>
        </div>
    </section>
    );
};

export default CategoriesSection;