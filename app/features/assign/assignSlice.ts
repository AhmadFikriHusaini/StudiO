import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../redux/Store";
import { initialAssignment, initialAssignmentStatus } from "./assignData";
import { GetAssignment, GetAssignmentStatus } from "./assignAction";

const assignmentStatusSlice = createSlice({
    name: "getAssignmentStatus",
    initialState: initialAssignmentStatus,
    reducers: {
        cleanUpAssignmentStatus: (state) => {
            state.data = {
                submission: {
                    id: null,
                    userid: null,
                    attemptnumber: null,
                    timecreated: null,
                    timemodified: null,
                    timestarted: null,
                    status: "new",
                    groupid: null,
                    assignment: null,
                },
                locked: false,
                feedback: null
            }
            state.status = "idle";
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(GetAssignmentStatus.fulfilled, (state, action) => {
                if (action.payload.errorcode) {
                    state.error = action.payload.message;
                    state.status = "failed";
                }
                const data = action.payload
                if (data) {
                    if (data.lastattempt.submission) {
                        state.data.submission = data.lastattempt.submission
                        data.feedback && (state.data.feedback = data.feedback)
                    }
                    if (data.lastattempt.teamsubmission) {
                        state.data.submission = data.lastattempt.teamsubmission
                        data.feedback && (state.data.feedback = data.feedback)
                    }
                    state.status = "success"
                }
            })
            .addCase(GetAssignmentStatus.pending, (state) => {
                state.status = "loading";
            })
            .addCase(GetAssignmentStatus.rejected, (state) => {
                state.status = "failed";
                state.error = "failed to fetch assignment status";
            })
    }
})

const assignmentSlice = createSlice({
    name: "getAssignment",
    initialState: initialAssignment,
    reducers: {
        cleanUpAssignment: (state) => {
            state.data = {
                courses: [
                    {
                        id: null,
                        assignments: [
                            {
                                id: null,
                                cmid: null,
                                course: null,
                                name: "",
                                allowsubmissionsfromdate: 0,
                                duedate: 0,
                                cutoffdate: 0,
                                configs: [
                                    {
                                        plugin: "",
                                        subtype: "",
                                        name: "",
                                        value: "",
                                    }
                                ],
                                intro: "",
                                introattachments: [
                                    {
                                        filename: "",
                                        fileurl: "",
                                        mimetype: "",
                                    }
                                ],
                                timelimit: null,
                            }
                        ]
                    }
                ]
            }
            state.status = "idle";
            state.error = null;
        }
    },
    extraReducers(builder) {
        builder
            .addCase(GetAssignment.fulfilled, (state, action) => {
                if (action.payload.errorcode) {
                    state.status = "failed";
                    state.error = action.payload.message;
                }
                state.status = "success";
                state.data = action.payload;

            })
            .addCase(GetAssignment.pending, (state) => {
                state.status = "loading";

            })
            .addCase(GetAssignment.rejected, (state) => {
                state.status = "failed";
                state.error = "failed to fetch assignment";

            })
    },
})

export const { cleanUpAssignmentStatus } = assignmentStatusSlice.actions
export const { cleanUpAssignment } = assignmentSlice.actions

export const getAssignmentStatus = (state: RootState) => state.assignmentStatus
export const getAssignment = (state: RootState) => state.assignment

const assignmentStatusReducer = assignmentStatusSlice.reducer
const assignmentReducer = assignmentSlice.reducer


export { assignmentStatusReducer, assignmentReducer }