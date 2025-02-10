import { AxiosInstance } from "axios";

const qs = require('qs');

const QuizService = {
    StartAttempt: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        quizid: number | undefined,
    }) => {
        const reponse = await AxiosInstance.post("/webservice/rest/server.php", null, { params })
        return reponse.data
    },
    GetUserAttempts: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        quizid: number,
        status: string,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params })
        return response.data
    },
    GetQuizQuestions: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        attemptid: number,
        page: number,
    }) => {
        const response = await AxiosInstance.get("/webservice/rest/server.php", { params })
        return response.data
    },
    SaveAttempt: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        attemptid: number,
        'data[0][name]': string,
        'data[0][value]': string,
        'data[1][name]': string,
        'data[1][value]': string,
        'data[2][name]': string,
        'data[2][value]': string,
    }) => {
        const response = await AxiosInstance.post("/webservice/rest/server.php", null, { params })
        return response.data
    },
    SubmitQuiz: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        attemptid: string | null,
        finishattempt: number,
        // data: any,
    }) => {
        const response = await AxiosInstance.post("/webservice/rest/server.php", null, { params })
        return response.data
    }
}

export default QuizService