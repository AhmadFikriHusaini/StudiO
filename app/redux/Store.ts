import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/AuthSlice";
import userReducer from "../features/user/UserSlice";
import courseReducer from "../features/course/CourseSlice";
import { assignmentReducer, assignmentStatusReducer } from "../features/assign/assignSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        course: courseReducer,
        assignmentStatus: assignmentStatusReducer,
        assignment: assignmentReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;