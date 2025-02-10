import { createSlice } from "@reduxjs/toolkit";
import { initialCourse } from "./CourseData";
import { RootState } from "../../redux/Store";
import { getCourseList } from "./CourseAction";

const courseSlice = createSlice({
    name: "course",
    initialState: initialCourse,
    reducers: {
        cleanUp: (state) => {
            state.data = [];
            state.error = null;
            state.status = "idle";
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCourseList.fulfilled, (state, action) => {
                if (action.payload.errorcode) {
                    state.error = action.payload.message;
                    state.status = "failed";
                }
                state.data = action.payload;
                state.status = "success";
            })
            .addCase(getCourseList.pending, (state) => {
                state.status = "loading";
            })
            .addCase(getCourseList.rejected, (state) => {
                state.status = "failed";
            })
    }
})

export const { cleanUp } = courseSlice.actions;

export const selectCourse = (state: RootState) => state.course;

const courseReducer = courseSlice.reducer;
export default courseReducer;