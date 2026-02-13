/**
 * Type definitions for the Amazon Automator application
 */

export interface Product {
    id: string;
    sheetId: string;
    title: string;
    price: number;
    category: string;
    categoryId?: string | null;
    branchName?: string;
    branchId?: string | null;
    image: string;
    url: string;
    description?: string | null;
    archived: boolean;
}

export interface Store {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Branch {
    id: string;
    name: string;
    storeId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    storeId: string;
    branchId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ScrapedProductData {
    url: string;
    title: string;
    description?: string;
    images: string[];
    price: number;
    currency: string;
    originalPrice?: number;
    available?: boolean;
    specifications?: Record<string, string>;
    rating?: number;
    reviewsCount?: number;
    debug?: any;
}

export interface CreateProductInput {
    title: string;
    price: number | string;
    image?: string;
    url: string;
    storeId: string;
    branchId?: string;
    categoryId?: string;
    description?: string;
}

export interface UpdateProductInput {
    title?: string;
    categoryId?: string | null;
    branchId?: string | null;
    description?: string | null;
}
