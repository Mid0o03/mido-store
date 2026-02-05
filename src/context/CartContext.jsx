import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Initialize cart from localStorage if available
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Failed to load cart", error);
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    // Persist to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems(prev => {
            // Check if item already exists
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                // If you want quantity logic, handle here. For digital products, usually 1 max.
                // We'll just return the previous state or alert 'already in cart'.
                // Moving the drawer open logic here for better UX
                setIsCartOpen(true);
                return prev;
            }
            setIsCartOpen(true);
            return [...prev, { ...product, addedAt: Date.now() }];
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const cartTotal = cartItems.reduce((total, item) => {
        // Parse price removing currency symbols
        const priceStr = item.price?.toString().replace(/[^0-9.]/g, '') || '0';
        return total + parseFloat(priceStr);
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            isCartOpen,
            addToCart,
            removeFromCart,
            clearCart,
            toggleCart,
            cartTotal,
            cartCount: cartItems.length
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
