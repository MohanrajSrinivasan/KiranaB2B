import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, ProductVariant } from "@/types";

interface ProductCardProps {
  productroduct;
  onAddToCart: (productIdumber, variantIdumber, quantityumber, variantroductVariant, productNametring) => void;
}

export default function ProductCard({ product, onAddToCart }roductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    onAddToCart(product.id, selectedVariant.id, quantity, selectedVariant, product.name);
    setQuantity(1); // Reset quantity after adding
  };

  const adjustQuantity = (deltaumber) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  // Filter variants for retail users (exclude bulk-only variants)
  const retailVariants = product.variants?.filter(variant => 
    !variant.label.toLowerCase().includes('sack') && 
    !variant.label.toLowerCase().includes('bulk')
  ) || [];

  if (retailVariants.length === 0) {
    return null; // Don't show products without retail variants
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card-hover">
      <div className="relative">
        <img
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          className="w-full h-40 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        {product.inventory?.isLowStock && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Low Stock
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        
        {/* Variant Selection */}
        {retailVariants.length > 1 && (
          <div className="mb-3">
            <Select
              value={selectedVariant?.id.toString()}
              onValueChange={(value) => {
                const variant = retailVariants.find(v => v.id.toString() === value);
                setSelectedVariant(variant || null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {retailVariants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id.toString()}>
                    {variant.label} - ₹{variant.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {selectedVariant && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xl font-bold text-primary">₹{selectedVariant.price}</span>
              <span className="text-sm text-gray-500">per {selectedVariant.unit}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => adjustQuantity(-1)}
                className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                -
              </button>
              <span className="px-3 py-1 border border-gray-300 rounded min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => adjustQuantity(1)}
                className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-500 ml-2">{selectedVariant.unit}</span>
            </div>
            
            <Button
              onClick={handleAddToCart}
              disabled={!product.inventory?.availableQuantity}
              className="w-full bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              {!product.inventory?.availableQuantity ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </>
        )}
        
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
