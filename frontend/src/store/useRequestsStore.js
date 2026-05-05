import { create } from "zustand";
import { axiosInstance } from "./axios";
import { showSuccess, showError } from "../utils/notification";

const ERROR_DEDUPE_WINDOW_MS = 10000;
let lastFetchHistoryErrorMessage = "";
let lastFetchHistoryErrorAt = 0;

const notifyFetchHistoryError = (message) => {
    const now = Date.now();
    if (message === lastFetchHistoryErrorMessage && now - lastFetchHistoryErrorAt < ERROR_DEDUPE_WINDOW_MS) {
        return;
    }

    lastFetchHistoryErrorMessage = message;
    lastFetchHistoryErrorAt = now;
    showError(message);
};

const clearFetchHistoryErrorDedupe = () => {
    lastFetchHistoryErrorMessage = "";
    lastFetchHistoryErrorAt = 0;
};


export const useRequest = create((set, get) => ({
    loading: false,
    itemRequests: [],
    
    fetchHistory: async () =>{
        set({loading: true});
        try {
            
            const res = await axiosInstance.get("/history/borrower-logs");

            const requests = Array.isArray(res.data?.requests) ? res.data.requests : [];
            const events = Array.isArray(res.data?.events) ? res.data.events : [];
            requests.sort((a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0));
            requests.events = events;

            set({itemRequests: requests});
                clearFetchHistoryErrorDedupe();

        } catch (error) {
              notifyFetchHistoryError(error?.response?.data?.message || "Failed to send request");
        }
        finally{
            set({loading: false});
        }
    },

    sendRequest: async (title, type, item_id) => {
        set({loading: true});

        try {
        
            const res = await axiosInstance.post("/items/borrow-item", {item_title :title, item_type: type, item_id});
            
            showSuccess(res?.data?.message || "Borrow request sent");
            
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

    cancelBorrowRequest: async (requestId) => {
        set({ loading: true });
        try {
            const res = await axiosInstance.patch("/items/cancel-borrow-request", { requestId });
            showSuccess(res?.data?.message || "Borrow request cancelled");
            await get().fetchHistory();
            return { ok: true };
        } catch (error) {
            const message = error?.response?.data?.message || "Failed to cancel borrow request";
            showError(message);
            return { ok: false, error: message };
        } finally {
            set({ loading: false });
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
