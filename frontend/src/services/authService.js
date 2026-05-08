import { axiosInstance } from "../store/axios";

// Get borrower signups
export const getBorrowerSignups = async () => {
  try {
    const response = await axiosInstance.get("/borrowers");
    return response.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Get user profile by email
export const getUserProfileByEmail = (email) => {
  // This would typically fetch from the backend
  // For now, return a basic profile structure
  return {
    id: email?.split("@")[0] || "-",
    email: email || "-",
  };
};

export const updateBorrowerAccountUser = async (payload = {}) => {
  try {
    if (payload.email) {
      const response = await axiosInstance.patch("/profile/change-email", {
        newEmail: payload.email,
      });
      return { ok: true, data: response.data };
    }

    if (payload.contactInfo) {
      const response = await axiosInstance.patch("/profile/change-number", {
        newNumber: payload.contactInfo,
      });
      return { ok: true, data: response.data };
    }

    if (payload.oldPassword && payload.password) {
      const response = await axiosInstance.patch("/profile/change-password", {
        currentPassword: payload.oldPassword,
        newPassword: payload.password,
      });
      return { ok: true, data: response.data };
    }

    return { ok: false, error: "No valid update payload provided." };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: err?.response?.data?.message || err?.message || "Failed to update account.",
    };
  }
};
