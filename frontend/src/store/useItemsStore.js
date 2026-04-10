import { create } from "zustand";
import { axiosInstance } from "./axios";
import { showSuccess, showError } from "../utils/notification";

const useItems = create((set, get) => ({
    books: [],
    count: 0,
    isLoading: false,

    clearItems: () => set({ books: [], count: 0 }),

    fetchBooks: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/items/get-items", {
                withCredentials: true,
            });

            const books = res?.data?.books || [];
            const count = res?.data?.count ?? books.length;
            
            set({ books: books, count });
        } catch (err) {
            console.error("fetchBooks error:", err);
            const msg =
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to fetch books";
            showError(msg);
        } finally {
            set({ isLoading: false });
        }
    },

    createItem: async (payload) => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.post("/items/post-items", payload, {
                withCredentials: true,
            });

            showSuccess(res?.data?.message || "Item created");

            // simplest: refresh list after creating
            await get().fetchBooks();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to create item";
            showError(msg);
        } finally {
            set({ isLoading: false });
        }
    },

    softDeleteItem: async (itemId) => {
        try {
            
            set({isLoading: true});

            const res = await axiosInstance.patch("/items/soft-delete", {itemId});
            
            showSuccess(res?.data?.message || "Item deleted");
            
            await get().fetchBooks();

        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to delete item");
        }
        finally{
            set({isLoading: false});
        }
    },

    deleteItem: async (itemId) =>{
        try {
            set({isLoading: true});
            
            const res = await axiosInstance.post("/items/delete", {itemId});

            await get().fetchBooks();
            
            showSuccess(res.data?.message);

        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to delete item");
        } finally {
            set({ isLoading: false });
        }
    },

    restoreItem: async (itemId) => {
        try {
            
            set({isLoading: true});

            const res = await axiosInstance.post("/items/restore", {itemId});
            
            showSuccess(res?.data?.message || "Item restored");
            
            await get().fetchBooks();

        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to restore item");
        }
        finally{
            set({isLoading: false});
        }
    },



}));

export default useItems;
