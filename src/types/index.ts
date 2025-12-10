export interface User {
    _id: string;
    email: string;
    nickname: string;
    role: 'waiter' | 'owner' | 'admin';
    restaurantId: string;
    isActive: boolean;
}

export interface Restaurant {
    _id: string;
    name: string;
    ownerId: string;
    subscription: {
        plan: 'free' | 'pro' | 'enterprise';
        status: 'active' | 'inactive';
    };
}

export interface Section {
    _id: string;
    name: string;
    restaurantId: string;
}

export interface Category {
    _id: string;
    name: string;
    restaurantId: string;
}

export interface Table {
    _id: string;
    name: string;
    displayName: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
    currentOrderId?: string;
    restaurantId: string;
    position?: {
        x: number;
        y: number;
    };
    rotation?: number;
    section?: Section | string; // Can be ID (string) or populated object (Section)
}

export interface MenuItem {
    _id: string;
    name: string;
    price: number;
    category: Category | string; // Can be ID (string) or populated object (Category)
    isAvailable: boolean;
    isPopular: boolean;
    modifiers?: Modifier[];
    restaurantId: string;
}

export interface Modifier {
    name: string;
    options: ModifierOption[];
}

export interface ModifierOption {
    name: string;
    price: number;
}

export interface OrderItem {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers?: ItemModifier[];
    notes?: string;
    status?: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface ItemModifier {
    name: string;
    option: string;
    price: number;
}

export interface Order {
    _id: string;
    orderNumber: number;
    restaurantId: string;
    tableId: string;
    waiterId: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentStatus: 'unpaid' | 'paid';
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served';
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    restaurant: Restaurant;
    accessToken: string;
    refreshToken: string;
}
