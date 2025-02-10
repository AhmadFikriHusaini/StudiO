import { createAction, createAsyncThunk, Dispatch } from "@reduxjs/toolkit";
import AuthService from "../../services/AuthService";
import { AxiosInstance } from "axios";

export const loginStart = createAction("auth/loginStart")
export const loginSuccess = createAction<any>("auth/loginSuccess")
export const loginFailed = createAction<any>("auth/loginFailed")

export const login = (instance: AxiosInstance, params: {
    username: string, password: string, service: string
}) => {
    return async (dispatch: Dispatch<any>) => {
        dispatch(loginStart())
        try {
            const response = await AuthService.login(instance, params)
            dispatch(loginSuccess(response.data))
        }
        catch (error) {
            dispatch(loginFailed(error))
        }
    }
}
export const getUserId = createAsyncThunk(
    "auth/getUserId",
    async (data: {
        AxiosInstance: AxiosInstance,
        params: {
            wsfunction: string,
            wstoken: string,
            moodlewsrestformat: string
        }
    }) => {
        const response = await AuthService.getUserId(data.AxiosInstance, data.params)
        return response.data
    }
)