import { AxiosInstance } from "axios"

const CourseService = {
    getCourseList: (AxiosInstance: AxiosInstance, params: {
        wsfunction: string,
        wstoken: string,
        moodlewsrestformat: string,
        userid: string | null,
    }) => AxiosInstance.get("/webservice/rest/server.php", { params }),
    getCourseDetails: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        courseid: number,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params })
        return response.data
    },
    getModuleDetailbyType: async (AxiosInstance: AxiosInstance, params: any) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params })
        return response.data
    },
    getActivityHistory: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        courseid: string | number,
        userid: string | null,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params });
        return response.data
    },
    getModuleHistory: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        cmid: number,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params });
        return response
    },
    getStudensByCourseId: (AxiosInstance: AxiosInstance, params: {
        wsfunction: string,
        wstoken: string,
        moodlewsrestformat: string,
        courseid: number,
    }) => AxiosInstance.get("/webservice/rest/server.php", { params }),
    getMembersByCourseId: async (AxiosInstance: AxiosInstance, params: {
        wsfunction: string,
        wstoken: string | null,
        moodlewsrestformat: string,
        courseid: number,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params });
        return response.data
    },
    completionByView: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null;
        wsfunction: string;
        moodlewsrestformat: string;
        urlid?: number;
        resourceid?: number;
    }) => {
        const response = await AxiosInstance.post("/webservice/rest/server.php", null, { params });
        return response.data
    },
    manualCompletion: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        completed: number,
        cmid: number | null
    }) => {
        const response = await AxiosInstance.post("/webservice/rest/server.php", null, { params });
        return response
    },
    getUserGrades: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        courseid: number,
        userid: string | null,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params });
        return response.data
    },
    getUserCourseGroups: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        courseid: number,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params });
        return response.data
    }

}

export default CourseService;