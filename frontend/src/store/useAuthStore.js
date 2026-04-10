import {create} from "zustand"
import { axiosInstance } from "./axios"
import { showSuccess, showError } from "../utils/notification"


const setupAxiosInterceptors = (store) => {
    let refreshPromise = null;

  axiosInstance.interceptors.response.use(
    res => res,
    async error => {
            const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
                originalRequest &&
        !originalRequest._retry &&
                !String(originalRequest.url || "").includes("/auth/refresh-token")
      ) {
        originalRequest._retry = true;

        try {
                    if (!refreshPromise) {
                        refreshPromise = store.getState().refreshToken().finally(() => {
                            refreshPromise = null;
                        });
                    }

                    const refreshed = await refreshPromise;
                    if (refreshed) {
                        return axiosInstance(originalRequest);
                    }

                    store.getState().clearAuthState();
                    return Promise.reject(error);
        } catch (refreshError) {
                    store.getState().clearAuthState();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

export const useStore = create((set, get) => ({
    
    user: null,
    isLoading: false,
    isCheckingAuth: false,
    borrowers: [],

        clearAuthState: () => {
            set({ user: null });
        },

    checkAuth: async () =>{
        try{
            set({isCheckingAuth: true});
            const res = await axiosInstance.get("/profile/profile");
            set({user: res.data});
        
            return true; 
        
        }catch{
            set({user: null});
            return false;
        }
        finally {
            set({isCheckingAuth: false});
        }
    },
    
    studentSignUp: async (
        email,
        password,
        idNumber,
        firstName,
        lastName,
        suffix,
        program,
        contactNumber,
        address
        
    ) =>{
        // Guard against duplicate submissions (StrictMode or rapid clicks)
        if (get().isSigningUp) {
            return false;
        }

        set({isLoading: true, isSigningUp: true});
        try{
            const res = await axiosInstance.post("/auth/signup", {
                email,
                password,
                idNumber,
                firstName,
                lastName,
                suffix,
                program,
                contactNumber,
                address
            });

            showSuccess("Account created successfully");
            set({user: res.data})

            return true;

        }
        catch(error){
            showError(error.response?.data?.message || "An Error occurred");
            set({ user: null });
            return false;
        }
        finally{
            set({isLoading: false, isSigningUp: false});
        }
    },

    Login: async (email, password) => {
        
        set({isLoading: true});
        try{
            const res = await axiosInstance.post("/auth/login", { email, password });
            
            set({ user: res.data});
            showSuccess("Login successful");
            return true;
        }
        catch(error){
            console.log("Login failed: ", error.message);
            showError(error.response?.data?.message || "An error occurred");
            set({ user: null });
            return false;
        }
        finally{
            set({isLoading: false});
        }
    },

    refreshToken: async () => {
        try {
            const res = await axiosInstance.post("/auth/refresh-token");
                        if (res?.data?.user) {
                            set({ user: res.data.user });
                        }
            return true;
        } catch (error) {
                        if (error?.response?.status !== 401) {
                            console.error("Token refresh failed:", error);
                        }
            return false;
        }
    },

    logout: async () => {
        set({isLoading: true})
        try {
            await axiosInstance.post("/auth/logout");
            set({ user: null});
        } catch (error) {
            showError(error.response?.data?.message || "An error occurred during logout");
        }
        finally{
            set({isLoading: false});
        }
    },
    
    getStudentBorrowers: async () =>{
        try {
            set({isLoading: true});

            const res = await axiosInstance.get("/profile/borrowers");
            
            console.log(res.data);
            
            set({ borrowers: Array.isArray(res.data.borrowers) ? res.data.borrowers : [] });

        } catch (error) {
           showError(error?.response?.data?.message || "An error occured fetching data"); 
        }
        finally{
            set({isLoading: false});
        }
    }

}));

const store = useStore;
setupAxiosInterceptors(store);


