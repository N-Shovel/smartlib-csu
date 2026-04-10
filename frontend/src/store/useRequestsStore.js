import { create } from "zustand";
import { axiosInstance } from "./axios";
import { showSuccess, showError } from "../utils/notification";


export const useRequest = create((set, get) => ({
    loading: false,
    itemRequests: [],
    
    fetchHistory: async () =>{
        set({loading: true});
        try {
            
            const res = await axiosInstance.get("/history/borrower-logs");

            console.log(res.data);

            const requests = Array.isArray(res.data?.requests) ? res.data.requests : [];
            requests.sort((a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0));

            set({itemRequests: requests});

        } catch (error) {
           showError(error?.response?.data?.message || "Failed to send request");
        }
        finally{
            set({loading: false});
        }
    },

    sendRequest: async (title, type, item_id) => {
        set({loading: true});

        try {
        
            const res = await axiosInstance.post("/items/borrow-item", {item_title :title, item_type: type, item_id});
            
            showSuccess(res?.data?.message || "Item created");
            
            await get().fetchHistory();

            return { ok: true, data: res.data };
            
        } catch (error) {
            showError(error?.response?.data?.message || "Failed to send request");
            throw error;
        }
        finally{
            set({loading: false});
        }
    },

    approveBorrowRequest: async (requestId) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.patch("/items/approve-borrow-request", { requestId });
            showSuccess(res?.data?.message || "Borrow request approved");
            await get().fetchHistory();
            return { ok: true };
        } catch (error) {
            const message = error?.response?.data?.message || "Failed to approve borrow request";
            showError(message);
            return { ok: false, error: message };
        } finally {
            set({ loading: false });
        }
    },

    requestReturn: async (itemId) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.patch("/items/request-return", { itemId });
            showSuccess(res?.data?.message || "Return request submitted");
            await get().fetchHistory();
            return { ok: true };
        } catch (error) {
            const message = error?.response?.data?.message || "Failed to request return";
            showError(message);
            return { ok: false, error: message };
        } finally {
            set({ loading: false });
        }
    },

    confirmReturnRequest: async (requestId) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.patch("/items/confirm-return", { requestId });
            showSuccess(res?.data?.message || "Book marked as returned");
            await get().fetchHistory();
            return { ok: true };
        } catch (error) {
            const message = error?.response?.data?.message || "Failed to confirm return";
            showError(message);
            return { ok: false, error: message };
        } finally {
            set({ loading: false });
        }
    }

}));
