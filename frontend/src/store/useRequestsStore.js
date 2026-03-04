import { create } from "zustand";
import { axiosInstance } from "./axios";
import { showSuccess, showError, showInfo } from "../utils/notification";


export const useRequest = create((set, get) => ({
    loading: false,
    itemRequests: [],
    
    fetchHistory: async () =>{
        set({loading: true});
        try {
            
            const res = await axiosInstance.get("/history/borrower-logs");

            console.log(res.data);

            set({itemRequests: res.data?.requests || []});

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
    }

}));
