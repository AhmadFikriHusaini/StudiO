import { createAsyncThunk } from "@reduxjs/toolkit";
import UserService from "../../services/UserService";
import { AxiosInstance } from "axios";

export const getUserProfile = createAsyncThunk(
    "user/getUserProfile",
    async (data: {
        instance: AxiosInstance,
        params: {
            moodlewsrestformat: string,
            wsfunction: string,
            wstoken: string,
            field: string,
            values: string[]
        }
    }) => {
        const response = await UserService.getUserProfile(data.instance, data.params)
        return response.data
    }
)