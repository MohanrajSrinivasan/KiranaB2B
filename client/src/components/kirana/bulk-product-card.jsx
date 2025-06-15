import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, ProductVariant } from "@/types";

interface BulkProductCardProps {
  productroduct;
  onAddToCart: (productIdumber, variantIdumber, quantityumber, variantroductVariant, productNametring) => void;
}

export default function BulkProductCard({ product, onAddToCart }ulkProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Filter variants for bulk purchases (prefer bulk variants)
  const bulkVariants = product.variants?.filter(variant => 
    variant.bulkPrice || 
    variant.label.toLowerCase().includes('sack') || 
    variant.label.toLowerCase().includes('kg') && variant.minBulkQuantity > 1
  ) || [];

  // Set default variant to the first bulk variant or the first available
  useState(() => {
    if (bulkVariants.length > 0 && !selectedVariant) {
      setSelectedVariant(bulkVariants[0]);
    }
  });

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    onAddToCart(product.id, selectedVariant.id, quantity, selectedVariant, product.name);
    setQuantity(1); // Reset quantity after adding
  };

  const adjustQuantity = (deltaumber) => {
    const minQuantity = selectedVariant?.minBulkQuantity || 1;
    setQuantity(prev => Math.max(minQuantity, prev + delta));
  };

  const calculateSavings = () => {
    if (!selectedVariant || !selectedVariant.bulkPrice) return 0;
    const regularPrice = parseFloat(selectedVariant.price);
    const bulkPrice = parseFloat(selectedVariant.bulkPrice);
    return (regularPrice - bulkPrice) * quantity;
  };

  if (bulkVariants.length === 0) {
    return null; // Don't show products without bulk variants
  }

  const savings = calculateSavings();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card-hover">
      <div className="relative">
        <img
          src={product.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
          alt={product.name}
          className="w-full h-40 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x200?text=No+Image';
          }}
        />
        {savings > 0 && (
          <Badge className="absolute top-2 right-2 bg-accent text-white">
            Save ₹{savings.toFixed(2)}
          </Badge>
        )}
        {product.inventory?.isLowStock && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Low Stock
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name} (Bulk)</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        
        {/* Variant Selection */}
        {bulkVariants.length > 1 && (
          <div className="mb-3">
            <Select
              value={selectedVariant?.id.toString()}
              onValueChange={(value) => {
                const variant = bulkVariants.find(v => v.id.toString() === value);
                setSelectedVariant(variant || null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select bulk size" />
              </SelectTrigger>
              <SelectContent>
                {bulkVariants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id.toString()}>
                    {variant.label} - ₹{variant.bulkPrice || variant.price}
                    {variant.bulkPrice && (
                      <span className="text-green-600 ml-2">
                        (Save ₹{(parseFloat(variant.price) - parseFloat(variant.bulkPrice)).toFixed(2)})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {selectedVariant && (
          <>
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-xl font-bold text-primary">
                  ₹{selectedVariant.bulkPrice || selectedVariant.price}
                </span>
                <span className="text-sm text-gray-500 ml-1">per {selectedVariant.label}</span>
                {selectedVariant.bulkPrice && (
                  <div className="text-xs text-green-600">
                    Regular: ₹{selectedVariant.price} | Save ₹{(parseFloat(selectedVariant.price) - parseFloat(selectedVariant.bulkPrice)).toFixed(2)}
                  </div>
                )}
              </div>
              {savings > 0 && (
                <Badge className="bg-accent/10 text-accent">
                  Total Save: ₹{savings.toFixed(2)}
                </Badge>
              )}
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
              <span className="text-sm text-gray-500 ml-2">
                {selectedVariant.label}s
              </span>
            </div>
            
            {selectedVariant.minBulkQuantity > 1 && (
              <p className="text-xs text-gray-500 mb-2">
                Minimum order: {selectedVariant.minBulkQuantity} {selectedVariant.label}s
              </p>
            )}
            
            <Button
              onClick={handleAddToCart}
              disabled={!product.inventory?.availableQuantity || quantity < (selectedVariant.minBulkQuantity || 1)}
              className="w-full bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              {!product.inventory?.availableQuantity 
                ? 'Out of Stock' 
                uantity < (selectedVariant.minBulkQuantity || 1)
                ? `Min ${selectedVariant.minBulkQuantity} required`
                : 'Add to Cart'}
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
