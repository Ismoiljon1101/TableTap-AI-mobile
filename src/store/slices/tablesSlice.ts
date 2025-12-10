import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Table } from '../../types';

interface TablesState {
    tables: Table[];
    selectedTable: Table | null;
    isLoading: boolean;
}

const initialState: TablesState = {
    tables: [],
    selectedTable: null,
    isLoading: false,
};

const tablesSlice = createSlice({
    name: 'tables',
    initialState,
    reducers: {
        setTables: (state, action: PayloadAction<Table[]>) => {
            state.tables = action.payload;
            state.isLoading = false;
        },
        selectTable: (state, action: PayloadAction<Table>) => {
            state.selectedTable = action.payload;
        },
        clearSelectedTable: (state) => {
            state.selectedTable = null;
        },
        updateTableStatus: (state, action: PayloadAction<{ tableId: string; status: Table['status'] }>) => {
            const table = state.tables.find(t => t._id === action.payload.tableId);
            if (table) {
                table.status = action.payload.status;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setTables, selectTable, clearSelectedTable, updateTableStatus, setLoading } = tablesSlice.actions;
export default tablesSlice.reducer;
