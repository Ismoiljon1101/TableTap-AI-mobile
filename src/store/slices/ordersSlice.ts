import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrderItem } from '../../types';

interface OrdersState {
    orders: Order[];
    currentOrder: OrderItem[];
    isLoading: boolean;
}

const initialState: OrdersState = {
    orders: [],
    currentOrder: [],
    isLoading: false,
};

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setOrders: (state, action: PayloadAction<Order[]>) => {
            state.orders = action.payload;
            state.isLoading = false;
        },
        addToCurrentOrder: (state, action: PayloadAction<OrderItem>) => {
            const existingItem = state.currentOrder.find(
                item => item.menuItemId === action.payload.menuItemId
            );

            if (existingItem) {
                existingItem.quantity += action.payload.quantity;
            } else {
                state.currentOrder.push(action.payload);
            }
        },
        removeFromCurrentOrder: (state, action: PayloadAction<string>) => {
            state.currentOrder = state.currentOrder.filter(
                item => item.menuItemId !== action.payload
            );
        },
        clearCurrentOrder: (state) => {
            state.currentOrder = [];
        },
        updateOrderQuantity: (state, action: PayloadAction<{ menuItemId: string; quantity: number }>) => {
            const item = state.currentOrder.find(i => i.menuItemId === action.payload.menuItemId);
            if (item) {
                item.quantity = action.payload.quantity;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const {
    setOrders,
    addToCurrentOrder,
    removeFromCurrentOrder,
    clearCurrentOrder,
    updateOrderQuantity,
    setLoading,
} = ordersSlice.actions;

export default ordersSlice.reducer;
