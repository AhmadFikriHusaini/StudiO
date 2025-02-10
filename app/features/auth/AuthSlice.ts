import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "./AuthData";
import { RootState } from "../../redux/Store";
import { getUserId, loginFailed, loginStart, loginSuccess } from "./AuthAction";
import { storeToken, storeUserId, storeUsername } from "../../utils/SecureStoreUtils";

const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        logout: (state) => {
            state.data.isLogin = false;
            state.status = "idle";
            state.error = null;
            storeToken.removeToken();
            storeUsername.removeUsername();
            storeUserId.removeUserId();
        },
        clearStatus: (state) => {
            state.status = "idle";
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginSuccess, (state, action) => {
                if (action.payload.errorcode) {
                    state.error = "Username or password is incorrect!";
                    state.data.isLogin = false;
                    state.status = "failed";
                    return
                }
                state.data.isLogin = true;
                state.status = "success";
                storeToken.setTokenSync(action.payload.token);
            })
            .addCase(loginStart, (state) => {
                state.status = "loading";
            })
            .addCase(loginFailed, (state, action) => {
                state.status = "failed";
                state.error = action.payload.message ?? "Something was wrong! Please try again later.";
            })
            .addCase(getUserId.fulfilled, (state, action) => {
                storeUserId.setUserIdSync(action.payload.userid.toString());
                storeUsername.setUsernameSync(action.payload.username);
                state.data.userid = action.payload.userid;
            })
            .addCase(getUserId.pending, (state) => {
                state.error = null;
            })
            .addCase(getUserId.rejected, (state, action) => {
                state.error = action.error.message || "Something was wrong! Please try again later.";
                state.status = "failed";
            })
    }
})

export const { logout, clearStatus } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

const authReducer = authSlice.reducer

export default authReducer;