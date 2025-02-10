import { createAsyncThunk } from "@reduxjs/toolkit"
import AssignmentService from "../../services/AssignmentService"
import { AxiosInstance } from "axios"

export const GetAssignment = createAsyncThunk(
    "assignment/getAssignment",
    async (data: {
        instance: AxiosInstance, params: {
            wstoken: string | null,
            wsfunction: string,
            moodlewsrestformat: string,
        }
    }) => {
        const response = await AssignmentService.getAssignmentModule(data.instance, data.params)
        return response.data
    }
)

export const GetAssignmentStatus = createAsyncThunk(
    "assignment/getAssignmentStatus",
    async (data: {
        instance: AxiosInstance, params: {
            wstoken: string | null,
            wsfunction: string,
            moodlewsrestformat: string,
            assignid: number | null,
        }
    }) => {
        const response = await AssignmentService.GetAssignmentStatus(data.instance, data.params)
        return response.data
    }
)