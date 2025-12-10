import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Restaurant } from '../../types';

interface AuthState {
    user: User | null;
    restaurant: Restaurant | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const initialState: AuthState = {
    user: null,
    restaurant: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<{
            user: User;
            restaurant: Restaurant;
            accessToken: string;
            refreshToken: string;
        }>) => {
            state.user = action.payload.user;
            state.restaurant = action.payload.restaurant;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
            state.isLoading = false;
        },
        logout: (state) => {
            state.user = null;
            state.restaurant = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { loginSuccess, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
