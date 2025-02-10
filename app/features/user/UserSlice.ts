import { createSlice } from "@reduxjs/toolkit";
import { initialUser } from "./UserData";
import { getUserProfile } from "./UserAction";
import { RootState } from "../../redux/Store";

export const userSlice = createSlice({
    name: "user",
    initialState: initialUser,
    reducers: {
        clearData: (state) => {
            state.data = [];
            state.status = "loading";
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUserProfile.fulfilled, (state, action) => {
                if (action.payload.errorcode) {
                    state.error = action.payload.message;
                    state.status = "failed";
                    return
                }
                state.data = action.payload;
                state.status = "success";
            })
            .addCase(getUserProfile.pending, (state) => {
                state.status = "loading";
            })
            .addCase(getUserProfile.rejected, (state) => {
                state.status = "failed";
            })
    }
})

export const { clearData } = userSlice.actions;

export const selectUser = (state: RootState) => state.user;

const userReducer = userSlice.reducer
export default userReducer;