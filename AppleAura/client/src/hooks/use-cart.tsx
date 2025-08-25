import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@shared/schema";
import { authService } from "@/lib/auth";
import { useAuth } from "./use-auth";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/cart", {
        headers: authService.getAuthHeaders(),
      });

      if (response.ok) {
        const cartItems = await response.json();
        setItems(cartItems);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (variantId: string, quantity: number) => {
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ variantId, quantity }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    try {
      const response = await fetch("/api/cart/update", {
        method: "PUT",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ variantId, quantity }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      throw error;
    }
  };

  const removeItem = async (variantId: string) => {
    try {
      const response = await fetch(`/api/cart/remove/${variantId}`, {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (response.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refetch: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}