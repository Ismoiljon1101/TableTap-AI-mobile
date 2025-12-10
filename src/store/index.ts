import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tablesReducer from './slices/tablesSlice';
import menuReducer from './slices/menuSlice';
import ordersReducer from './slices/ordersSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tables: tablesReducer,
        menu: menuReducer,
        orders: ordersReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
