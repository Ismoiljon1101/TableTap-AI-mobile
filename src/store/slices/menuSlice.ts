import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuItem } from '../../types';

interface MenuState {
    items: MenuItem[];
    isLoading: boolean;
}

const initialState: MenuState = {
    items: [],
    isLoading: false,
};

const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        setMenuItems: (state, action: PayloadAction<MenuItem[]>) => {
            state.items = action.payload;
            state.isLoading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setMenuItems, setLoading } = menuSlice.actions;
export default menuSlice.reducer;
