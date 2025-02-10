import { createAsyncThunk } from "@reduxjs/toolkit";
import CourseService from "../../services/CourseService";
import { AxiosInstance } from "axios";

export const getCourseList = createAsyncThunk(
    "course/getCourseList",
    async (data: {
        instance: AxiosInstance,
        params: {
            wsfunction: string,
            wstoken: string,
            moodlewsrestformat: string,
            userid: string | null,
        }
    }) => {
        const response = await CourseService.getCourseList(data.instance, data.params)
        return response.data
    }
)